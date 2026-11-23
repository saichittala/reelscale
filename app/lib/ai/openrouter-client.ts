import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../db";

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
 * Retrieve OpenRouter API key from environment variables or .env.local file
 */
export function getOpenRouterApiKey(): string {
  const envKey = process.env.OPENROUTER_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  const fromFile = readKeyFromLocalEnvFile("OPENROUTER_API_KEY");
  if (fromFile) {
    process.env.OPENROUTER_API_KEY = fromFile;
    return fromFile;
  }
  return "";
}

/**
 * Retrieve effective OpenRouter API key, falling back to Neon database settings if needed
 */
export async function getEffectiveOpenRouterApiKey(): Promise<string> {
  const envKey = getOpenRouterApiKey();
  if (envKey) return envKey;

  try {
    const sql = getDb();
    const rows = await sql.query("SELECT openrouter_api_key FROM ai_automation_settings LIMIT 1;");
    if (rows.length > 0 && rows[0].openrouter_api_key) {
      const dbKey = String(rows[0].openrouter_api_key).trim();
      if (dbKey) {
        process.env.OPENROUTER_API_KEY = dbKey;
        return dbKey;
      }
    }
  } catch (err) {
    console.warn("Failed to read openrouter_api_key from db:", err);
  }
  return "";
}

/**
 * Maps any model identifier to a verified OpenRouter model ID
 */
export function mapModelToOpenRouter(model?: string): string {
  if (!model) return "meta-llama/llama-3.3-70b-instruct";
  if (model.includes("/")) return model;
  if (model.startsWith("llama-3.3-70b")) return "meta-llama/llama-3.3-70b-instruct";
  if (model.startsWith("llama-3.1-8b")) return "meta-llama/llama-3.1-8b-instruct";
  if (model.startsWith("mixtral")) return "mistralai/mixtral-8x7b-instruct";
  return "meta-llama/llama-3.3-70b-instruct";
}

export interface OpenRouterCompletionOptions {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  stage?: string;
}

export interface OpenRouterCompletionResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs: number;
  model: string;
  provider: "openrouter";
}

/**
 * Call OpenRouter API as resilient tertiary backup
 */
export async function callOpenRouter(
  options: OpenRouterCompletionOptions
): Promise<OpenRouterCompletionResult> {
  const apiKey = await getEffectiveOpenRouterApiKey();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Please add OPENROUTER_API_KEY to your environment variables."
    );
  }

  const model = mapModelToOpenRouter(options.model);
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

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://reelscale.in",
          "X-Title": "ReelScale AI Studio",
        },
        body: JSON.stringify(payload),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
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
        logOpenRouterUsage({
          provider: "openrouter",
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
        provider: "openrouter",
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`OpenRouter API attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Log failed usage
  if (options.stage) {
    logOpenRouterUsage({
      provider: "openrouter",
      model,
      stage: options.stage,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      latency_ms: 0,
      status: "error",
      error_message: lastError?.message || "OpenRouter completion failed",
    }).catch(() => {});
  }

  throw lastError || new Error("Failed to execute OpenRouter completion after retries");
}

/**
 * Health check for OpenRouter API
 */
export async function checkOpenRouterHealth(): Promise<{
  status: "connected" | "error";
  latencyMs: number | null;
  activeModel: string;
  isTertiaryBackup: boolean;
  message?: string;
}> {
  const start = Date.now();
  try {
    const apiKey = await getEffectiveOpenRouterApiKey();
    if (!apiKey) {
      return {
        status: "error",
        latencyMs: null,
        activeModel: "meta-llama/llama-3.3-70b-instruct",
        isTertiaryBackup: true,
        message: "OPENROUTER_API_KEY not configured",
      };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://reelscale.in",
        "X-Title": "ReelScale Health Check",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      return {
        status: "error",
        latencyMs,
        activeModel: "meta-llama/llama-3.3-70b-instruct",
        isTertiaryBackup: true,
        message: `HTTP ${res.status}: ${err.slice(0, 100)}`,
      };
    }

    return {
      status: "connected",
      latencyMs,
      activeModel: "meta-llama/llama-3.3-70b-instruct",
      isTertiaryBackup: true,
    };
  } catch (err: any) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      activeModel: "meta-llama/llama-3.3-70b-instruct",
      isTertiaryBackup: true,
      message: err.message || "Failed to communicate with OpenRouter API",
    };
  }
}

async function logOpenRouterUsage(record: {
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
