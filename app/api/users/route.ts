import { NextRequest, NextResponse } from "next/server";
import { checkRole, clearUserCache } from "../rbac";

export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_USERS_URL = process.env.GOOGLE_SCRIPT_USERS_URL || "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";

async function proxyToGoogleScript(body: Record<string, unknown>) {
  const response = await fetch(GOOGLE_SCRIPT_USERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function GET(request: Request) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json({ success: true, users: [] });
  }
  try {
    const response = await fetch(GOOGLE_SCRIPT_USERS_URL);
    const data = await response.json();
    return NextResponse.json(data);
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

    switch (action) {
      case "add": {
        clearUserCache();
        const result = await proxyToGoogleScript({
          action: "add",
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        });
        return NextResponse.json(result);
      }
      case "update": {
        clearUserCache();
        const result = await proxyToGoogleScript({
          action: "update",
          id: data.id,
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        });
        return NextResponse.json(result);
      }
      case "delete": {
        clearUserCache();
        const result = await proxyToGoogleScript({
          action: "delete",
          id: data.id,
        });
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}