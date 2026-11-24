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

export interface GroqLikeClient {
  models: {
    list: () => Promise<{ data: Array<{ id: string; created?: number; owned_by?: string }> }>;
  };
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: string };
      }) => Promise<{
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }>;
    };
  };
}

let cachedGroqClient: GroqLikeClient | null = null;
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
  } catch { }
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

  // Check Sanity Environment Variables
  try {
    const { getEnvironmentVariablesFromSanity } = await import("../../sanity/env-sync");
    const envVars = await getEnvironmentVariablesFromSanity();
    if (envVars?.groqApiKey) {
      process.env.GROQ_API_KEY = envVars.groqApiKey;
      return envVars.groqApiKey;
    }
  } catch { }

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

async function createGroqClientInstance(apiKey: string): Promise<GroqLikeClient> {
  try {
    const mod = await import("groq-sdk");
    const GroqClass = (mod.default || mod) as any;
    return new GroqClass({ apiKey });
  } catch {
    return {
      models: {
        list: async () => {
          const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Groq models error (${res.status}): ${errText}`);
          }
          return await res.json();
        },
      },
      chat: {
        completions: {
          create: async (body: any) => {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Groq completions error (${res.status}): ${errText}`);
            }
            return await res.json();
          },
        },
      },
    };
  }
}

export async function getGroqClient(): Promise<GroqLikeClient> {
  const apiKey = await getEffectiveGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Please add GROQ_API_KEY to your environment variables or System Status."
    );
  }

  if (cachedGroqClient && cachedKey === apiKey) {
    return cachedGroqClient;
  }

  cachedGroqClient = await createGroqClientInstance(apiKey);
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
        ? [...chatModels, "gemini-3.5-flash-lite", "meta-llama/llama-3.3-70b-instruct"]
        : ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "gemini-3.5-flash-lite", "meta-llama/llama-3.3-70b-instruct"];

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
 * Tier 2 -> Google Gemini (gemini-3.5-flash-lite)
 * Tier 3 -> OpenRouter AI (meta-llama/llama-3.3-70b-instruct)
 */
async function executeGroq(options: GroqCompletionOptions): Promise<{
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latencyMs: number;
  model: string;
}> {
  // Fast-failover if Groq is currently in rate-limit cooldown
  if (Date.now() < groqRateLimitedUntil) {
    throw new Error("Groq rate-limit cooldown active");
  }

  const groqKey = await getEffectiveGroqApiKey();
  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const client = await getGroqClient();
  let model = options.model || (await getActiveAiModel());

  // Automatic model mapping: map deprecated/unavailable model IDs to active high-speed Groq models
  if (model === "llama-3.3-70b-versatile" || model === "llama3-70b-8192" || model.startsWith("gemini-")) {
    model = "openai/gpt-oss-120b";
  } else if (model === "llama-3.1-8b-instant" || model === "llama3-8b-8192") {
    model = "openai/gpt-oss-20b";
  }

  const maxRetries = 2;
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

      groqRateLimitedUntil = 0;

      if (usage) {
        logProviderUsage({
          provider: "groq",
          model,
          stage: options.stage || "general",
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          latency_ms: latencyMs,
          status: "success",
        }).catch(() => {});
      }

      return { content, usage, latencyMs, model };
    } catch (err: any) {
      lastError = err;
      const isRateOrTokenLimit =
        err?.status === 429 ||
        /rate_limit|rate limit|quota|tokens|tpm|tpd|rpd|resource_exhausted|insufficient_quota|overloaded/i.test(
          err?.message || ""
        );
      if (isRateOrTokenLimit) {
        groqRateLimitedUntil = Date.now() + 60 * 1000;
        throw err;
      }
    }
  }

  throw lastError || new Error("Groq execution failed");
}

/**
 * 3-Tier Enterprise AI Engine:
 * Tier 1 (PRIMARY): Google Gemini (gemini-3.5-flash-lite)
 * Tier 2 (FALLBACK): Groq LPU (openai/gpt-oss-120b)
 * Tier 3 (TERTIARY): OpenRouter (meta-llama/llama-3.3-70b-instruct)
 */
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
  // 1. Explicit OpenRouter routing
  if (
    options.model &&
    (options.model.startsWith("meta-llama/") ||
      options.model.startsWith("anthropic/") ||
      options.model.startsWith("deepseek/") ||
      options.model.startsWith("openrouter/"))
  ) {
    return await callOpenRouter(options);
  }

  // 2. Explicit Groq routing
  if (
    options.model &&
    (options.model.startsWith("llama-") ||
      options.model.startsWith("openai/gpt-oss") ||
      options.model.startsWith("gsk_"))
  ) {
    try {
      return await executeGroq(options);
    } catch (err: any) {
      console.warn(`[Groq Explicit Failed] ${err.message}. Falling back to Gemini Tier 1...`);
    }
  }

  // 3. TIER 1 (PRIMARY): Google Gemini
  const geminiKey = await getEffectiveGeminiApiKey();
  if (geminiKey) {
    try {
      return await callGemini({
        ...options,
        model: mapModelToGemini(options.model),
      });
    } catch (geminiErr: any) {
      console.warn(
        `[AI Failover Tier 1 -> 2] Gemini primary failed (${geminiErr.message}). Escalating to Groq LPU backup...`
      );
    }
  }

  // 4. TIER 2 (FALLBACK): Groq LPU
  try {
    return await executeGroq(options);
  } catch (groqErr: any) {
    console.warn(
      `[AI Failover Tier 2 -> 3] Groq backup failed (${groqErr.message}). Escalating to OpenRouter tertiary backup...`
    );
  }

  // 5. TIER 3 (TERTIARY FALLBACK): OpenRouter Multi-Provider
  const openrouterKey = await getEffectiveOpenRouterApiKey();
  if (openrouterKey) {
    return await callOpenRouter({
      ...options,
      model: mapModelToOpenRouter(options.model),
    });
  }

  throw new Error("All AI providers (Gemini Tier 1, Groq Tier 2, OpenRouter Tier 3) exhausted or unavailable.");
}

async function logProviderUsage(record: {
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

export { checkGeminiHealth, getEffectiveGeminiApiKey, callGemini } from "./gemini-client";
export { checkOpenRouterHealth, getEffectiveOpenRouterApiKey, callOpenRouter } from "./openrouter-client";
