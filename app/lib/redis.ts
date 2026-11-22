import Redis, { type RedisOptions } from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: Redis | undefined;
  // eslint-disable-next-line no-var
  var redisCircuitBreakerUntil: number | undefined;
}

// ── Configuration & Credentials ──
const REDIS_URL = process.env.REDIS_URL?.trim();
const REDIS_HOST = process.env.REDIS_HOST?.trim() || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD?.trim() || undefined;

// Circuit breaker settings: if connection fails, pause Redis attempts for 30s
// to prevent blocking database fallbacks and avoid latency spikes in production.
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000;

export function isCircuitBreakerOpen(): boolean {
  if (!globalThis.redisCircuitBreakerUntil) return false;
  if (Date.now() < globalThis.redisCircuitBreakerUntil) return true;
  globalThis.redisCircuitBreakerUntil = undefined;
  return false;
}

export function tripCircuitBreaker(reason?: string): void {
  globalThis.redisCircuitBreakerUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Redis Circuit Breaker] Tripped for ${CIRCUIT_BREAKER_COOLDOWN_MS}ms. Reason: ${reason || "Connection failure"}`);
  }
}

export function resetRedisCircuitBreaker(): void {
  globalThis.redisCircuitBreakerUntil = undefined;
}

/**
 * Parses connection info without exposing passwords
 */
export function getRedisSanitizedHost(): { host: string; port: number; isTls: boolean } {
  if (REDIS_URL) {
    try {
      const parsed = new URL(REDIS_URL);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || (parsed.protocol === "rediss:" ? 6379 : 6379)),
        isTls: parsed.protocol === "rediss:",
      };
    } catch {
      // Fallback if URL parsing fails
    }
  }
  return {
    host: REDIS_HOST,
    port: REDIS_PORT,
    isTls: false,
  };
}

/**
 * Builds serverless-resilient RedisOptions with fast fail-safety
 */
function buildRedisOptions(): { url?: string; options: RedisOptions } {
  const isTlsUrl = REDIS_URL?.startsWith("rediss://");

  const baseOptions: RedisOptions = {
    // Serverless-tuned timeouts: fail fast instead of hanging client requests
    connectTimeout: 3000,
    commandTimeout: 2000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    keepAlive: 10000,
    retryStrategy(times) {
      if (times > 2) {
        tripCircuitBreaker(`Max retry attempts reached (${times})`);
        return null; // Stop retrying immediately
      }
      return Math.min(times * 150, 500);
    },
  };

  if (REDIS_URL) {
    // When REDIS_URL is provided, DO NOT pass host/port to avoid ioredis option override conflicts
    const urlOptions: RedisOptions = {
      ...baseOptions,
    };

    if (isTlsUrl) {
      urlOptions.tls = {
        rejectUnauthorized: false,
      };
    }

    return { url: REDIS_URL, options: urlOptions };
  }

  // Discrete host/port configuration
  const discreteOptions: RedisOptions = {
    ...baseOptions,
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  };

  return { options: discreteOptions };
}

function createRedisInstance(): Redis {
  const { url, options } = buildRedisOptions();
  const client = url ? new Redis(url, options) : new Redis(options);

  client.on("connect", () => {
    resetRedisCircuitBreaker();
    if (process.env.NODE_ENV !== "production") {
      console.log("[Redis] Connected successfully to Redis server");
    }
  });

  client.on("error", (err) => {
    // Prevent unhandled error crashes
    if (err.message && !err.message.includes("offline queue is disabled")) {
      tripCircuitBreaker(err.message);
    }
  });

  client.on("close", () => {
    // Sockets close naturally in serverless execution pauses
  });

  return client;
}

// Global singleton instance across Next.js reloads and serverless hot invocations
export const redis: Redis = globalThis.redisGlobal ?? createRedisInstance();

if (process.env.NODE_ENV !== "production") {
  globalThis.redisGlobal = redis;
}

/**
 * Ensures connection is active in serverless runtimes without hanging
 */
async function ensureConnected(): Promise<boolean> {
  if (isCircuitBreakerOpen()) {
    return false;
  }

  if (redis.status === "ready") {
    return true;
  }

  if (redis.status === "connecting") {
    // Wait briefly for in-flight handshake
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(redis.status === "ready"), 1500);
      redis.once("ready", () => {
        clearTimeout(timer);
        resolve(true);
      });
      redis.once("error", () => {
        clearTimeout(timer);
        resolve(false);
      });
    });
  }

  // Connect if idle, closed, or disconnected
  if (redis.status === "wait" || redis.status === "close" || redis.status === "end") {
    try {
      const connectPromise = redis.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Redis connection timeout (3000ms)")), 3000)
      );
      await Promise.race([connectPromise, timeoutPromise]);
      return (redis.status as string) === "ready";
    } catch (err: any) {
      tripCircuitBreaker(err?.message || "Connection failed");
      return false;
    }
  }

  return false;
}

/**
 * Retrieve cached item parsed as JSON or primitive. Returns null on miss or error.
 */
export async function redisGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const isConn = await ensureConnected();
    if (!isConn) return null;

    const data = await redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Redis] GET failed for "${key}":`, err?.message);
    }
    return null;
  }
}

/**
 * Set item in Redis with TTL in seconds. Fails silently to prevent blocking app flow.
 */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    const isConn = await ensureConnected();
    if (!isConn) return false;

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, stringValue, "EX", ttlSeconds);
    } else {
      await redis.set(key, stringValue);
    }
    return true;
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Redis] SET failed for "${key}":`, err?.message);
    }
    return false;
  }
}

/**
 * Delete key or keys from Redis
 */
export async function redisDel(key: string | string[]): Promise<boolean> {
  try {
    const isConn = await ensureConnected();
    if (!isConn) return false;

    const keys = Array.isArray(key) ? key : [key];
    if (keys.length === 0) return true;

    await redis.del(...keys);
    return true;
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Redis] DEL failed for key(s):`, err?.message);
    }
    return false;
  }
}

/**
 * Non-blocking pattern invalidation using SCAN instead of blocking KEYS
 */
export async function redisInvalidatePattern(pattern: string): Promise<number> {
  try {
    const isConn = await ensureConnected();
    if (!isConn) return 0;

    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== "0");

    return deletedCount;
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Redis] SCAN invalidation failed for "${pattern}":`, err?.message);
    }
    return 0;
  }
}

/**
 * Cache-aside helper: Check cache first, call fetcher on miss, cache and return.
 * Guarantees that fetcher() is executed if Redis is offline or down.
 */
export async function redisRemember<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redisGet<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  if (fresh !== null && fresh !== undefined) {
    await redisSet(key, fresh, ttlSeconds);
  }
  return fresh;
}

/**
 * Diagnostic health check with latency measurement
 */
export async function checkRedisHealth(): Promise<{
  status: "connected" | "disconnected" | "error";
  pingMs?: number;
  message?: string;
  uptimeSeconds?: number;
  connectedClients?: number;
}> {
  const start = Date.now();
  try {
    const isConn = await ensureConnected();
    if (!isConn) {
      return {
        status: "disconnected",
        message: isCircuitBreakerOpen()
          ? "Circuit breaker active (temporary cooldown due to connection failure)"
          : `Redis connection state: ${redis.status}`,
      };
    }

    const pong = await redis.ping();
    const pingMs = Date.now() - start;

    if (pong === "PONG") {
      let uptimeSeconds: number | undefined;
      let connectedClients: number | undefined;

      try {
        const info = await redis.info();
        const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
        if (uptimeMatch) uptimeSeconds = Number(uptimeMatch[1]);
        const clientMatch = info.match(/connected_clients:(\d+)/);
        if (clientMatch) connectedClients = Number(clientMatch[1]);
      } catch {
        // Safe to ignore info parsing error
      }

      return {
        status: "connected",
        pingMs,
        uptimeSeconds,
        connectedClients,
      };
    }

    return { status: "error", message: `Unexpected response: ${pong}` };
  } catch (err: any) {
    tripCircuitBreaker(err?.message);
    return {
      status: "error",
      message: err?.message || "Failed to reach Redis server",
    };
  }
}
