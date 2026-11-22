import Redis, { type RedisOptions } from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: Redis | undefined;
  // eslint-disable-next-line no-var
  var redisCircuitBreakerUntil: number | undefined;
}

// ── Configuration Helper ──
export function getRedisConfig() {
  const url = process.env.REDIS_URL?.trim();
  const host = process.env.REDIS_HOST?.trim() || "127.0.0.1";
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return { url, host, port, password, restUrl, restToken };
}

// Circuit breaker settings: if TCP fails, pause TCP attempts for 30s
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
  const { url, host, port } = getRedisConfig();
  if (url) {
    try {
      const parsed = new URL(url);
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
    host,
    port,
    isTls: false,
  };
}

/**
 * REST API client fallback for Edge / serverless runtimes where TCP is restricted
 */
async function executeRestCommand<T = any>(command: (string | number)[]): Promise<T | null> {
  const { restUrl, restToken } = getRedisConfig();
  if (!restUrl || !restToken) return null;
  try {
    const endpoint = `${restUrl}/${command.map((p) => encodeURIComponent(String(p))).join("/")}`;
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${restToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result as T;
  } catch {
    return null;
  }
}

/**
 * Builds serverless-resilient RedisOptions with fast fail-safety
 */
function buildRedisOptions(): { url?: string; options: RedisOptions } {
  const { url, host, port, password } = getRedisConfig();
  const isTlsUrl = url?.startsWith("rediss://");

  const baseOptions: RedisOptions = {
    connectTimeout: 3000,
    commandTimeout: 2000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    keepAlive: 10000,
    retryStrategy(times) {
      if (times > 2) {
        tripCircuitBreaker(`Max retry attempts reached (${times})`);
        return null;
      }
      return Math.min(times * 150, 500);
    },
  };

  if (url) {
    const urlOptions: RedisOptions = {
      ...baseOptions,
    };

    if (isTlsUrl) {
      urlOptions.tls = {
        rejectUnauthorized: false,
      };
    }

    return { url, options: urlOptions };
  }

  const discreteOptions: RedisOptions = {
    ...baseOptions,
    host,
    port,
    password,
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
  if (isCircuitBreakerOpen()) return null;
  try {
    const isConn = await ensureConnected();
    if (isConn) {
      const data = await redis.get(key);
      if (data) {
        try {
          return JSON.parse(data) as T;
        } catch {
          return data as unknown as T;
        }
      }
      return null;
    }

    // Fallback to Upstash REST API if TCP socket is unavailable/circuit-broken
    const restData = await executeRestCommand<string>(["get", key]);
    if (restData) {
      try {
        return JSON.parse(restData) as T;
      } catch {
        return restData as unknown as T;
      }
    }
    return null;
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
  if (isCircuitBreakerOpen()) return false;
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    const isConn = await ensureConnected();

    if (isConn) {
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.set(key, stringValue, "EX", ttlSeconds);
      } else {
        await redis.set(key, stringValue);
      }
      return true;
    }

    // Fallback to Upstash REST API
    const command = ttlSeconds && ttlSeconds > 0
      ? ["set", key, stringValue, "EX", ttlSeconds]
      : ["set", key, stringValue];
    const restRes = await executeRestCommand(command);
    return restRes === "OK";
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
  if (isCircuitBreakerOpen()) return false;
  try {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length === 0) return true;

    const isConn = await ensureConnected();
    if (isConn) {
      await redis.del(...keys);
      return true;
    }

    // Fallback to Upstash REST API
    const restRes = await executeRestCommand(["del", ...keys]);
    return restRes !== null;
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
  if (isCircuitBreakerOpen()) return 0;
  try {
    const isConn = await ensureConnected();
    if (isConn) {
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
    }

    // Fallback to Upstash REST API
    let cursor = "0";
    let deletedCount = 0;
    do {
      const scanRes = await executeRestCommand<[string, string[]]>(["scan", cursor, "match", pattern, "count", 100]);
      if (!scanRes || !Array.isArray(scanRes)) break;
      const [nextCursor, keys] = scanRes;
      cursor = nextCursor;
      if (Array.isArray(keys) && keys.length > 0) {
        await executeRestCommand(["del", ...keys]);
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
    if (isConn) {
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
    }

    // Check Upstash REST health as fallback
    const { restUrl } = getRedisConfig();
    if (restUrl) {
      const restPong = await executeRestCommand<string>(["ping"]);
      if (restPong === "PONG") {
        return {
          status: "connected",
          pingMs: Date.now() - start,
          message: "Connected via Upstash REST fallback",
        };
      }
    }

    return {
      status: "disconnected",
      message: isCircuitBreakerOpen()
        ? "Circuit breaker active (temporary cooldown due to connection failure)"
        : `Redis connection state: ${redis.status}`,
    };
  } catch (err: any) {
    tripCircuitBreaker(err?.message);
    return {
      status: "error",
      message: err?.message || "Failed to reach Redis server",
    };
  }
}
