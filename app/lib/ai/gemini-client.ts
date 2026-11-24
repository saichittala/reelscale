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

  // Check Sanity Environment Variables
  try {
    const { getEnvironmentVariablesFromSanity } = await import("../../sanity/env-sync");
    const envVars = await getEnvironmentVariablesFromSanity();
    if (envVars?.geminiApiKey) {
      process.env.GEMINI_API_KEY = envVars.geminiApiKey;
      return envVars.geminiApiKey;
    }
  } catch {}

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
 * Active, supported Gemini models ranked by speed, quota availability, and response quality
 */
export const GEMINI_ACTIVE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
];

/**
 * Maps any model name to a suitable Gemini model
 */
export function mapModelToGemini(model?: string): string {
  if (model && model.startsWith("gemini-")) {
    // If it's an obsolete model or one with strictly restricted free quotas, route to active modern flash-lite
    if (
      model === "gemini-1.5-flash" ||
      model === "gemini-2.0-flash" ||
      model === "gemini-2.5-flash"
    ) {
      return "gemini-3.5-flash-lite";
    }
    return model;
  }
  // Default high-performance, generous quota model
  return "gemini-3.5-flash-lite";
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
 * Call Gemini API using Google's OpenAI-compatible endpoint with automatic multi-model failover
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

  const primaryModel = mapModelToGemini(options.model);
  const candidateModels = [
    primaryModel,
    ...GEMINI_ACTIVE_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
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
        const isQuotaOrDemand =
          response.status === 429 ||
          response.status === 503 ||
          response.status === 404 ||
          /quota|exhausted|resource_exhausted|demand/i.test(errorText);

        if (isQuotaOrDemand) {
          console.warn(
            `[Gemini Fallback] Model "${model}" returned ${response.status} (${errorText.slice(0, 80)}). Trying next candidate Gemini model...`
          );
          lastError = new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
          continue;
        }
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
      console.warn(`[Gemini Attempt] "${model}" failed: ${err.message}`);
    }
  }

  // Log failed usage
  if (options.stage) {
    logGeminiUsage({
      provider: "gemini",
      model: primaryModel,
      stage: options.stage,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      latency_ms: 0,
      status: "error",
      error_message: lastError?.message || "Gemini completion failed across all candidate models",
    }).catch(() => {});
  }

  // Check if OpenRouter tertiary backup is available before failing
  const openrouterKey = await getEffectiveOpenRouterApiKey();
  if (openrouterKey) {
    console.warn(
      `[AI Failover Tier 2 -> 3] All Gemini models exhausted (${lastError?.message}). Seamlessly escalating to OpenRouter tertiary backup...`
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

  throw lastError || new Error("Failed to execute Gemini completion after testing all models");
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
        activeModel: "gemini-3.5-flash-lite",
        isBackup: true,
        message: "GEMINI_API_KEY not configured",
      };
    }

    // Ping candidates to find active model
    for (const model of GEMINI_ACTIVE_MODELS) {
      const modelStart = Date.now();
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: "ping" }],
              max_tokens: 10,
            }),
          }
        );

        if (res.ok) {
          return {
            status: "connected",
            latencyMs: Date.now() - modelStart,
            activeModel: model,
            isBackup: true,
          };
        }
      } catch {}
    }

    return {
      status: "error",
      latencyMs: Date.now() - start,
      activeModel: "gemini-3.5-flash-lite",
      isBackup: true,
      message: "All Gemini model endpoints exhausted or unavailable",
    };
  } catch (err: any) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      activeModel: "gemini-3.5-flash-lite",
      isBackup: true,
      message: err.message || "Failed to communicate with Gemini API",
    };
  }
}

async function logGeminiUsage(record: {
  provider: string;
  model: string;
  stage?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  latency_ms?: number;
  status?: string;
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
        record.stage || "general",
        record.prompt_tokens || 0,
        record.completion_tokens || 0,
        record.total_tokens || 0,
        record.latency_ms || 0,
        record.status || "success",
        record.error_message || null,
      ]
    );
  } catch {}
}
