import Redis, { type RedisOptions } from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redisOptions: RedisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 failed attempts
    }
    return Math.min(times * 100, 1000);
  },
};

function createRedisInstance(): Redis {
  const client = REDIS_URL ? new Redis(REDIS_URL, redisOptions) : new Redis(redisOptions);

  client.on("connect", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[Redis] Connected to Redis server successfully");
    }
  });

  client.on("error", (err) => {
    // Graceful error logging without crashing process
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Redis] Client connection warning:", err.message);
    }
  });

  return client;
}

// Preserve singleton instance across Next.js hot module reloads
export const redis: Redis = globalThis.redisGlobal ?? createRedisInstance();

if (process.env.NODE_ENV !== "production") {
  globalThis.redisGlobal = redis;
}

/**
 * Ensures connection is open before running commands
 */
async function ensureConnected(): Promise<boolean> {
  if (redis.status === "ready" || redis.status === "connecting") {
    return true;
  }
  if (redis.status === "wait") {
    try {
      await redis.connect();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Get cached item parsed as JSON or primitive
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
    console.warn(`[Redis] GET failed for key "${key}":`, err?.message);
    return null;
  }
}

/**
 * Set item in Redis with optional TTL in seconds
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
    console.warn(`[Redis] SET failed for key "${key}":`, err?.message);
    return false;
  }
}

/**
 * Delete one or more keys from Redis
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
    console.warn(`[Redis] DEL failed for key(s) "${key}":`, err?.message);
    return false;
  }
}

/**
 * Invalidate keys matching a pattern (e.g. "clients:*")
 */
export async function redisInvalidatePattern(pattern: string): Promise<number> {
  try {
    const isConn = await ensureConnected();
    if (!isConn) return 0;

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      return keys.length;
    }
    return 0;
  } catch (err: any) {
    console.warn(`[Redis] Pattern delete failed for pattern "${pattern}":`, err?.message);
    return 0;
  }
}

/**
 * Cache-aside wrapper: Returns cached data if available; otherwise calls fetcher(), caches result and returns it.
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
 * Health check helper for Redis server status and latency
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
      return { status: "disconnected", message: `Redis status: ${redis.status}` };
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
        // ignore info parse error
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
    return {
      status: "error",
      message: err?.message || "Failed to connect to Redis server",
    };
  }
}
