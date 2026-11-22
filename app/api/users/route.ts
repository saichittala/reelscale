import { NextRequest, NextResponse } from "next/server";
import { checkRole, clearUserCache } from "../rbac";
import { getDb } from "../../lib/db";
import { redisGet, redisSet, redisDel } from "../../lib/redis";

export const dynamic = "force-dynamic";

const REDIS_CACHE_KEY = "neon:users:list";
const CACHE_TTL_SECONDS = 3600; // 1 hour

export async function GET(request: Request) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json({ success: true, users: [] });
  }

  try {
    // Check Redis cache first for Neon users
    const cached = await redisGet<{ success: boolean; users: any[] }>(REDIS_CACHE_KEY);
    if (cached && Array.isArray(cached.users)) {
      return NextResponse.json(cached);
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, name, email, password, role
      FROM users
      ORDER BY id ASC;
    `;

    const result = {
      success: true,
      users: rows.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
      })),
    };

    // Cache in Redis
    await redisSet(REDIS_CACHE_KEY, result, CACHE_TTL_SECONDS);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action !== "login") {
      const rbac = await checkRole(request, ["admin"]);
      if (!rbac.authorized) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }
    }

    const sql = getDb();
    clearUserCache();
    await redisDel(REDIS_CACHE_KEY);

    switch (action) {
      case "add": {
        const rows = await sql`
          INSERT INTO users (name, email, password, role)
          VALUES (
            ${data.name || ''},
            ${String(data.email).trim().toLowerCase()},
            ${String(data.password || '123456')},
            ${data.role || 'sales'}
          )
          RETURNING id, name, email, password, role;
        `;
        return NextResponse.json({ success: true, user: rows[0] });
      }

      case "update": {
        const rows = await sql`
          UPDATE users
          SET
            name = ${data.name || ''},
            email = ${String(data.email).trim().toLowerCase()},
            password = ${String(data.password || '')},
            role = ${data.role || 'sales'},
            updated_at = NOW()
          WHERE id = ${Number(data.id)}
          RETURNING id, name, email, password, role;
        `;
        return NextResponse.json({ success: true, user: rows[0] });
      }

      case "delete": {
        await sql`
          DELETE FROM users
          WHERE id = ${Number(data.id)};
        `;
        return NextResponse.json({ success: true, message: "User deleted" });
      }

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
