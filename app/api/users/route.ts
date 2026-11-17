import { NextRequest, NextResponse } from "next/server";
import { checkRole, clearUserCache } from "../rbac";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json({ success: true, users: [] });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, email, password, role
      FROM users
      ORDER BY id ASC;
    `;

    return NextResponse.json({
      success: true,
      users: rows.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
      })),
    });
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

    switch (action) {
      case "add": {
        const rows = await sql`
          INSERT INTO users (name, email, password, role)
          VALUES (
            ${data.name},
            ${String(data.email).trim().toLowerCase()},
            ${String(data.password)},
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
            name = ${data.name},
            email = ${String(data.email).trim().toLowerCase()},
            password = ${String(data.password)},
            role = ${data.role},
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
