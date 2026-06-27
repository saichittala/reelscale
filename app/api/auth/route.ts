import { NextRequest, NextResponse } from "next/server";

const GOOGLE_SCRIPT_USERS_URL = process.env.GOOGLE_SCRIPT_USERS_URL!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    // Fetch users from Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_USERS_URL);
    const data = await response.json();

    const users = data.users || data || [];

    // Find matching user (case-insensitive email)
    const user = users.find(
      (u: { email: string; password: string }) =>
        u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { password: _pwd, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: {
        id: userWithoutPassword.id,
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
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