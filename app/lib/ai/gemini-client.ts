import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../db";
import {
  callOpenRouter,
  getEffectiveOpenRouterApiKey,
  mapModelToOpenRouter,
} from "./openrouter-client";

let cachedKey: string | null = null;

function readKeyFromLocalEnvFile(keyName: string): string {
  try {
    const envPath = join(process.cwd(), ".env.local");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      const match = content.match(new RegExp(`^${keyName}=(.*)$`, "m"));
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
  return "";
}

/**
 * Retrieve Gemini API key from environment variables or .env.local file
 */
export function getGeminiApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  const fromFile =
    readKeyFromLocalEnvFile("GEMINI_API_KEY") ||
    readKeyFromLocalEnvFile("GOOGLE_API_KEY");
  if (fromFile) {
    process.env.GEMINI_API_KEY = fromFile;
    return fromFile;
  }
  return "";
}

/**
 * Retrieve effective Gemini API key, falling back to Neon database settings if needed
 */
export async function getEffectiveGeminiApiKey(): Promise<string> {
  const envKey = getGeminiApiKey();
  if (envKey) return envKey;

  try {
    const sql = getDb();
    const rows = await sql.query("SELECT gemini_api_key FROM ai_automation_settings LIMIT 1;");
    if (rows.length > 0 && rows[0].gemini_api_key) {
      const dbKey = String(rows[0].gemini_api_key).trim();
      if (dbKey) {
        process.env.GEMINI_API_KEY = dbKey;
        return dbKey;
      }
    }
  } catch (err) {
    console.warn("Failed to read gemini_api_key from db:", err);
  }
  return "";
}

/**
 * Maps any model name to a suitable Gemini model
 */
export function mapModelToGemini(model?: string): string {
  if (model && model.startsWith("gemini-")) {
    return model;
  }
  // Default high-performance, generous token limit model for blog writing
  return "gemini-2.5-flash";
}

export interface GeminiCompletionOptions {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  stage?: string;
}

export interface GeminiCompletionResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs: number;
  model: string;
  provider: "gemini";
}

/**
 * Call Gemini API using Google's OpenAI-compatible endpoint with automatic retry
 */
export async function callGemini(
  options: GeminiCompletionOptions
): Promise<GeminiCompletionResult> {
  const apiKey = await getEffectiveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your environment variables."
    );
  }

  const model = mapModelToGemini(options.model);
  const maxRetries = 2;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    const start = Date.now();
    try {
      const payload: Record<string, any> = {
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
      };

      if (options.response_format?.type === "json_object") {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content || "";
      const usage = json.usage
        ? {
            prompt_tokens: json.usage.prompt_tokens || 0,
            completion_tokens: json.usage.completion_tokens || 0,
            total_tokens: json.usage.total_tokens || 0,
          }
        : undefined;

      // Log usage asynchronously to DB
      if (usage && options.stage) {
        logGeminiUsage({
          provider: "gemini",
          model,
          stage: options.stage,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          latency_ms: latencyMs,
          status: "success",
        }).catch(() => {});
      }

      return {
        content,
        usage,
        latencyMs,
        model,
        provider: "gemini",
      };
    } catch (err: any) {
      lastError = err;
      console.warn(
        `Gemini API attempt ${attempt}/${maxRetries} failed: ${err.message}`
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Log failed usage
  if (options.stage) {
    logGeminiUsage({
      provider: "gemini",
      model,
      stage: options.stage,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      latency_ms: 0,
      status: "error",
      error_message: lastError?.message || "Gemini completion failed",
    }).catch(() => {});
  }

  // Check if OpenRouter tertiary backup is available before failing
  const openrouterKey = await getEffectiveOpenRouterApiKey();
  if (openrouterKey) {
    console.warn(
      `[AI Failover Tier 2 -> 3] Gemini backup failed (${lastError?.message}). Seamlessly escalating to OpenRouter tertiary backup...`
    );
    try {
      return (await callOpenRouter({
        ...options,
        model: mapModelToOpenRouter(options.model),
      })) as any;
    } catch (orErr: any) {
      console.error("OpenRouter tertiary backup also failed:", orErr.message);
    }
  }

  throw lastError || new Error("Failed to execute Gemini completion after retries");
}

/**
 * Health check for Gemini API
 */
export async function checkGeminiHealth(): Promise<{
  status: "connected" | "error";
  latencyMs: number | null;
  activeModel: string;
  isBackup: boolean;
  message?: string;
}> {
  const start = Date.now();
  try {
    const apiKey = await getEffectiveGeminiApiKey();
    if (!apiKey) {
      return {
        status: "error",
        latencyMs: null,
        activeModel: "gemini-2.5-flash",
        isBackup: true,
        message: "GEMINI_API_KEY not configured",
      };
    }

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 10,
        }),
      }
    );

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      return {
        status: "error",
        latencyMs,
        activeModel: "gemini-2.5-flash",
        isBackup: true,
        message: `HTTP ${res.status}: ${err.slice(0, 100)}`,
      };
    }

    return {
      status: "connected",
      latencyMs,
      activeModel: "gemini-2.5-flash",
      isBackup: true,
    };
  } catch (err: any) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      activeModel: "gemini-2.5-flash",
      isBackup: true,
      message: err.message || "Failed to communicate with Gemini API",
    };
  }
}

async function logGeminiUsage(record: {
  provider: string;
  model: string;
  stage: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status: string;
  error_message?: string;
}) {
  try {
    const sql = getDb();
    await sql.query(
      `INSERT INTO ai_provider_usage (
        provider, model, stage, prompt_tokens, completion_tokens, total_tokens, latency_ms, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        record.provider,
        record.model,
        record.stage,
        record.prompt_tokens,
        record.completion_tokens,
        record.total_tokens,
        record.latency_ms,
        record.status,
        record.error_message || null,
      ]
    );
  } catch (e) {
    // Non-blocking telemetry
  }
}
