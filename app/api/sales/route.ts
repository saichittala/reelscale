import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

const GOOGLE_SCRIPT_SALES_URL = process.env.GOOGLE_SCRIPT_SALES_URL!;

async function proxyToGoogleScript(body: Record<string, unknown>) {
  const response = await fetch(GOOGLE_SCRIPT_SALES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function GET() {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json({ success: true, sales: [] });
  }
  try {
    const response = await fetch(GOOGLE_SCRIPT_SALES_URL);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "add": {
        const result = await proxyToGoogleScript({
          action: "add",
          category: data.category,
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          phoneNumber: data.phoneNumber,
          notes: data.notes,
          contacted: data.contacted,
        });
        return NextResponse.json(result);
      }
      case "update": {
        const result = await proxyToGoogleScript({
          action: "update",
          id: data.id,
          category: data.category,
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          phoneNumber: data.phoneNumber,
          notes: data.notes,
          contacted: data.contacted,
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
    console.error("Sales API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}