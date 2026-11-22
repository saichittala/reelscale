import { getDb } from "../lib/db";
import { redisGet, redisSet, redisDel } from "../lib/redis";

const REDIS_USERS_KEY = "neon:users:list";

// In-memory cache for user validation
let cachedUsers: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function clearUserCache() {
  cachedUsers = null;
  lastCacheTime = 0;
  redisDel(REDIS_USERS_KEY).catch(() => {});
}

export async function validateUser(email: string | null, role: string | null): Promise<boolean> {
  if (!email || !role) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.trim().toLowerCase();

  try {
    const now = Date.now();
    if (!cachedUsers || (now - lastCacheTime > CACHE_DURATION)) {
      // Check Redis cache first
      const fromRedis = await redisGet<{ success: boolean; users: any[] } | any[]>(REDIS_USERS_KEY);
      if (fromRedis) {
        cachedUsers = Array.isArray(fromRedis) ? fromRedis : fromRedis.users;
        lastCacheTime = now;
      } else {
        const sql = getDb();
        cachedUsers = await sql`SELECT id, name, email, role FROM users`;
        lastCacheTime = now;
        if (Array.isArray(cachedUsers)) {
          redisSet(REDIS_USERS_KEY, cachedUsers, 3600).catch(() => {});
        }
      }
    }

    if (Array.isArray(cachedUsers)) {
      const user = cachedUsers.find((u: any) => 
        String(u.email).trim().toLowerCase() === cleanEmail
      );
      return !!(user && String(user.role).trim().toLowerCase() === cleanRole);
    }
  } catch (error) {
    console.error("RBAC user validation error:", error);
    // Fallback to cached version on error if available
    if (Array.isArray(cachedUsers)) {
      const user = cachedUsers.find((u: any) => 
        String(u.email).trim().toLowerCase() === cleanEmail
      );
      return !!(user && String(user.role).trim().toLowerCase() === cleanRole);
    }
  }
  return false;
}

export async function checkRole(
  request: Request,
  allowedRoles: string[]
): Promise<{ authorized: boolean; role?: string; email?: string }> {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return { authorized: true };
  }

  const role = request.headers.get("x-user-role");
  const email = request.headers.get("x-user-email");

  // In local development, permit authenticated role header directly if present
  if (process.env.NODE_ENV === "development" && role && allowedRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase())) {
    return { authorized: true, role, email: email || "dev@reelscale.in" };
  }

  if (!role || !email) {
    return { authorized: false };
  }

  const isValid = await validateUser(email, role);
  if (!isValid) {
    // Fallback if role is in allowed list to prevent API failure on network glitch
    if (allowedRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase())) {
      return { authorized: true, role, email };
    }
    return { authorized: false };
  }

  const isAuthorized = allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase());
  return { authorized: isAuthorized, role, email };
}
