import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../rbac";

export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_CLIENTS_URL = process.env.GOOGLE_SCRIPT_CLIENTS_URL || "https://script.google.com/macros/s/AKfycbwjmC5mDKejUEDSuXsf_7IlhEznHR7vA9pvu1O16DOS8J2Nn6bXNEv_w3xaOuRFAXZS/exec";

async function proxyToGoogleScript(body: Record<string, unknown>) {
  const response = await fetch(GOOGLE_SCRIPT_CLIENTS_URL, {
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
    return NextResponse.json({ success: true, clients: [] });
  }
  try {
    const response = await fetch(GOOGLE_SCRIPT_CLIENTS_URL);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "add": {
        const result = await proxyToGoogleScript({
          action: "add",
          clientName: data.clientName || data.name,
          business: data.business,
          phone: data.phone,
          instagram: data.instagram,
          reels: Number(data.reels),
          pricePerReel: Number(data.pricePerReel),
          image: data.image || "",
          billingModel: data.billingModel || "Reel-to-Reel",
          plan: data.plan || "",
          baseRate: Number(data.baseRate || 0),
          bargain: Number(data.bargain || 0),
          date: data.date || "",
        });
        return NextResponse.json(result);
      }
      case "update": {
        const result = await proxyToGoogleScript({
          action: "update",
          id: data.id,
          clientName: data.clientName || data.name,
          business: data.business,
          phone: data.phone,
          instagram: data.instagram,
          reels: Number(data.reels),
          pricePerReel: Number(data.pricePerReel),
          image: data.image || "",
          billingModel: data.billingModel || "Reel-to-Reel",
          plan: data.plan || "",
          baseRate: Number(data.baseRate || 0),
          bargain: Number(data.bargain || 0),
          date: data.date || "",
        });
        return NextResponse.json(result);
      }
      case "delete": {
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
    console.error("Clients API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}