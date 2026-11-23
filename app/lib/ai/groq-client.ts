import Groq from "groq-sdk";
import { getDb } from "../db";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  callGemini,
  getEffectiveGeminiApiKey,
  mapModelToGemini,
  checkGeminiHealth,
} from "./gemini-client";
import {
  callOpenRouter,
  getEffectiveOpenRouterApiKey,
  mapModelToOpenRouter,
  checkOpenRouterHealth,
} from "./openrouter-client";

let cachedGroqClient: Groq | null = null;
let cachedKey: string | null = null;
let groqRateLimitedUntil = 0; // Timestamp until which Groq is considered in rate-limit cooldown

// Cache supported models to avoid querying Groq on every request
let supportedModelsCache: { models: string[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

export function getGroqApiKey(): string {
  const envKey = process.env.GROQ_API_KEY || process.env.GROQ_API;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  const fromFile = readKeyFromLocalEnvFile("GROQ_API_KEY") || readKeyFromLocalEnvFile("GROQ_API");
  if (fromFile) {
    process.env.GROQ_API_KEY = fromFile;
    return fromFile;
  }
  return "";
}

export async function getEffectiveGroqApiKey(): Promise<string> {
  const envKey = getGroqApiKey();
  if (envKey) return envKey;

  // Check database settings
  try {
    const sql = getDb();
    const rows = await sql.query("SELECT groq_api_key FROM ai_automation_settings LIMIT 1;");
    if (rows.length > 0 && rows[0].groq_api_key) {
      return rows[0].groq_api_key.trim();
    }
  } catch (err) {
    console.warn("Failed to read groq_api_key from db:", err);
  }
  return "";
}

export async function getGroqClient(): Promise<Groq> {
  const apiKey = await getEffectiveGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Please add GROQ_API_KEY to your environment variables or System Status."
    );
  }

  if (cachedGroqClient && cachedKey === apiKey) {
    return cachedGroqClient;
  }

  cachedGroqClient = new Groq({ apiKey });
  cachedKey = apiKey;
  return cachedGroqClient;
}

export async function getActiveAiModel(): Promise<string> {
  try {
    const sql = getDb();
    const rows = await sql.query("SELECT model FROM ai_automation_settings LIMIT 1;");
    if (rows.length > 0 && rows[0].model) {
      return rows[0].model;
    }
  } catch (err) {
    console.warn("Failed to get active model from db:", err);
  }
  return "openai/gpt-oss-120b";
}

export async function getSupportedGroqModels(): Promise<{
  models: { id: string; created?: number; owned_by?: string }[];
  chatModels: string[];
}> {
  const now = Date.now();
  if (supportedModelsCache && now - supportedModelsCache.timestamp < CACHE_TTL_MS) {
    return {
      models: supportedModelsCache.models.map((id) => ({ id })),
      chatModels: supportedModelsCache.models,
    };
  }

  try {
    const client = await getGroqClient();
    const list = await client.models.list();
    const allModels = list.data || [];

    // Filter models suitable for text generation/chat (exclude whisper/guard models)
    const chatModels = allModels
      .map((m) => m.id)
      .filter(
        (id) =>
          !id.startsWith("whisper-") &&
          !id.includes("prompt-guard") &&
          !id.includes("safeguard")
      );

    // Fallbacks if list is filtered out
    const finalChatList =
      chatModels.length > 0
        ? [...chatModels, "gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct"]
        : ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct"];

    supportedModelsCache = {
      models: finalChatList,
      timestamp: now,
    };

    return {
      models: allModels,
      chatModels: finalChatList,
    };
  } catch (err: any) {
    console.error("Failed to list Groq models:", err);
    return {
      models: [{ id: "openai/gpt-oss-120b" }, { id: "openai/gpt-oss-20b" }, { id: "qwen/qwen3.8-27b" }],
      chatModels: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"],
    };
  }
}

export async function checkGroqHealth(): Promise<{
  status: "connected" | "error";
  latencyMs: number | null;
  activeModel: string;
  availableChatModels: string[];
  message?: string;
}> {
  const start = Date.now();
  try {
    const client = await getGroqClient();
    const activeModel = await getActiveAiModel();
    const { chatModels } = await getSupportedGroqModels();

    // Quick light test completion
    await client.chat.completions.create({
      model: chatModels.includes(activeModel) ? activeModel : chatModels[0] || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });

    const latencyMs = Date.now() - start;
    return {
      status: "connected",
      latencyMs,
      activeModel,
      availableChatModels: chatModels,
    };
  } catch (err: any) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      activeModel: "unknown",
      availableChatModels: [],
      message: err.message || "Failed to communicate with Groq API",
    };
  }
}

export interface GroqCompletionOptions {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  stage?: string;
}

/**
 * Cascading failover helper:
 * Tier 2 -> Google Gemini (gemini-2.5-flash)
 * Tier 3 -> OpenRouter AI (meta-llama/llama-3.3-70b-instruct)
 */
async function handleFailover(
  options: GroqCompletionOptions,
  reason: string
): Promise<{
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latencyMs: number;
  model: string;
}> {
  // Tier 2: Google Gemini Backup
  const geminiKey = await getEffectiveGeminiApiKey();
  if (geminiKey) {
    try {
      console.warn(
        `[AI Failover Tier 2] ${reason}. Routing stage "${options.stage || 'general'}" to Gemini (${mapModelToGemini(options.model)})...`
      );
      return await callGemini({
        ...options,
        model: mapModelToGemini(options.model),
      });
    } catch (geminiErr: any) {
      console.warn(
        `[AI Failover Tier 2 -> 3] Gemini backup failed (${geminiErr.message}). Escalating to OpenRouter tertiary backup...`
      );
    }
  }

  // Tier 3: OpenRouter Multi-Provider Backup
  const openrouterKey = await getEffectiveOpenRouterApiKey();
  if (openrouterKey) {
    console.warn(
      `[AI Failover Tier 3] Routing stage "${options.stage || 'general'}" to OpenRouter (${mapModelToOpenRouter(options.model)})...`
    );
    return await callOpenRouter({
      ...options,
      model: mapModelToOpenRouter(options.model),
    });
  }

  throw new Error(`AI generation failed: Groq (${reason}) and no backup providers available.`);
}

export async function callGroqWithRetry(options: GroqCompletionOptions): Promise<{
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs: number;
  model: string;
}> {
  // 1. Direct routing if model is explicitly a Gemini model
  if (options.model && options.model.startsWith("gemini-")) {
    return await callGemini(options);
  }

  // 2. Direct routing if model is explicitly an OpenRouter model
  if (
    options.model &&
    (options.model.startsWith("meta-llama/") ||
      options.model.startsWith("anthropic/") ||
      options.model.startsWith("deepseek/") ||
      options.model.startsWith("openrouter/"))
  ) {
    return await callOpenRouter(options);
  }

  // 3. Fast-failover if Groq is currently in rate-limit cooldown
  if (Date.now() < groqRateLimitedUntil) {
    return await handleFailover(options, "Groq rate-limit cooldown active");
  }

  // 4. Check Groq API Key availability
  const groqKey = await getEffectiveGroqApiKey();
  if (!groqKey) {
    return await handleFailover(options, "GROQ_API_KEY is not configured");
  }

  const client = await getGroqClient();
  const model = options.model || (await getActiveAiModel());
  const maxRetries = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    const start = Date.now();
    try {
      const response = await client.chat.completions.create({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
        response_format: options.response_format,
      });

      const latencyMs = Date.now() - start;
      const content = response.choices[0]?.message?.content || "";
      const usage = response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens || 0,
            completion_tokens: response.usage.completion_tokens || 0,
            total_tokens: response.usage.total_tokens || 0,
          }
        : undefined;

      // Reset cooldown on successful Groq call
      groqRateLimitedUntil = 0;

      // Log usage asynchronously to DB
      if (usage && options.stage) {
        logProviderUsage({
          provider: "groq",
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
      };
    } catch (err: any) {
      lastError = err;
      const isRateOrTokenLimit =
        err?.status === 429 ||
        /rate_limit|rate limit|quota|tokens|tpm|tpd|rpd|resource_exhausted|insufficient_quota|overloaded/i.test(
          err?.message || ""
        );
      const isTimeout = err?.code === "ETIMEDOUT" || err?.message?.includes("timeout");

      // If token limits are over or rate limit encountered, immediately attempt cascading failover
      if (isRateOrTokenLimit) {
        groqRateLimitedUntil = Date.now() + 60 * 1000; // 60s cooldown
        return await handleFailover(
          options,
          `Groq token/rate limit hit (${err.message})`
        );
      }

      if ((isRateOrTokenLimit || isTimeout || err?.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`Groq API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delay)}ms... Error: ${err.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Log failed usage
      if (options.stage) {
        logProviderUsage({
          provider: "groq",
          model,
          stage: options.stage,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          latency_ms: Date.now() - start,
          status: "error",
          error_message: err?.message || "Unknown error",
        }).catch(() => {});
      }

      break;
    }
  }

  // If all Groq retries failed, attempt cascading backup before throwing
  return await handleFailover(
    options,
    `Groq exhausted all retries (${lastError?.message})`
  );
}

async function logProviderUsage(record: {
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

export { checkGeminiHealth, getEffectiveGeminiApiKey, callGemini } from "./gemini-client";
export { checkOpenRouterHealth, getEffectiveOpenRouterApiKey, callOpenRouter } from "./openrouter-client";
