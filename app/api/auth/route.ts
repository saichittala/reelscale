import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    const sql = getDb();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // Query user by email from Neon Postgres
    const rows = await sql`
      SELECT id, name, email, password, role
      FROM users
      WHERE LOWER(TRIM(email)) = ${cleanEmail}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Check password
    if (String(user.password).trim() !== cleanPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}
