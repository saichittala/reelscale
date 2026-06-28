import { NextRequest } from "next/server";

const GOOGLE_SCRIPT_USERS_URL = process.env.GOOGLE_SCRIPT_USERS_URL || "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";

// In-memory cache for user validation
let cachedUsers: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function clearUserCache() {
  cachedUsers = null;
  lastCacheTime = 0;
}

export async function validateUser(email: string | null, role: string | null): Promise<boolean> {
  if (!email || !role) return false;
  try {
    const now = Date.now();
    if (!cachedUsers || (now - lastCacheTime > CACHE_DURATION)) {
      const response = await fetch(GOOGLE_SCRIPT_USERS_URL);
      const data = await response.json();
      cachedUsers = data.users || data || [];
      lastCacheTime = now;
    }

    if (Array.isArray(cachedUsers)) {
      const user = cachedUsers.find((u: any) => 
        u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );
      return !!(user && user.role.toLowerCase() === role.toLowerCase());
    }
  } catch (error) {
    console.error("RBAC user validation error:", error);
    // Fallback to cached version on network failure if available
    if (Array.isArray(cachedUsers)) {
      const user = cachedUsers.find((u: any) => 
        u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );
      return !!(user && user.role.toLowerCase() === role.toLowerCase());
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

  if (!role || !email) {
    return { authorized: false };
  }

  const isValid = await validateUser(email, role);
  if (!isValid) {
    return { authorized: false };
  }

  const isAuthorized = allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase());
  return { authorized: isAuthorized, role, email };
}
