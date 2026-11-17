import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { DeliveredReel } from "../../../dashboard/types";

export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_CLIENTS_URL =
  process.env.GOOGLE_SCRIPT_CLIENTS_URL ||
  "https://script.google.com/macros/s/AKfycbwjmC5mDKejUEDSuXsf_7IlhEznHR7vA9pvu1O16DOS8J2Nn6bXNEv_w3xaOuRFAXZS/exec";

const DELIVERIES_FILE = join(process.cwd(), "content", "deliveries.json");
const MONTHLY_DRIVES_FILE = join(process.cwd(), "content", "monthly_drives.json");

function getDeliveries(): DeliveredReel[] {
  try {
    if (!existsSync(DELIVERIES_FILE)) return [];
    const content = readFileSync(DELIVERIES_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

function getMonthlyDriveConfig(clientId: string | number, month?: string | null): { link: string; showDriveLink: boolean } {
  try {
    if (!existsSync(MONTHLY_DRIVES_FILE)) return { link: "", showDriveLink: false };
    const content = readFileSync(MONTHLY_DRIVES_FILE, "utf-8");
    const links = JSON.parse(content || "{}");
    const key = `${clientId}_${month || new Date().toISOString().slice(0, 7)}`;
    const entry = links[key];
    if (!entry) return { link: "", showDriveLink: false };
    if (typeof entry === "string") {
      return { link: entry, showDriveLink: true };
    }
    return {
      link: entry.link || "",
      showDriveLink: entry.showDriveLink !== false,
    };
  } catch {
    return { link: "", showDriveLink: false };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // Fetch clients to find this client
    let clients: any[] = [];
    try {
      const response = await fetch(GOOGLE_SCRIPT_CLIENTS_URL, {
        next: { revalidate: 30 },
      });
      const data = await response.json();
      clients = data.clients || data || [];
    } catch (e) {
      console.warn("Could not fetch remote clients:", e);
    }

    const client = clients.find((c: any) => String(c.id) === String(id));

    if (!client) {
      return NextResponse.json(
        { success: false, message: "Client tracking portal not found" },
        { status: 404 }
      );
    }

    // Sanitize client details for public/portal view (no financial rates)
    const clientName = client.clientName || client.name || "";
    const business = client.business || "";
    
    // Normalized passcodes (e.g. client name + @123)
    const expectedPasscodes = [
      `${clientName.toLowerCase().trim()}@123`,
      `${clientName.toLowerCase().replace(/\s+/g, "")}@123`,
      `${business.toLowerCase().trim()}@123`,
      `${business.toLowerCase().replace(/\s+/g, "")}@123`,
    ].filter(Boolean);

    // Get deliveries for this client
    let deliveries = getDeliveries().filter(
      (d) => String(d.clientId) === String(id)
    );

    if (month && month !== "all") {
      deliveries = deliveries.filter((d) => d.month === month);
    }

    deliveries.sort(
      (a, b) => (b.deliveredDate || "").localeCompare(a.deliveredDate || "")
    );

    // Monthly Google Drive link for this month
    const driveConfig = getMonthlyDriveConfig(id, month);
    const driveLink = driveConfig.showDriveLink ? driveConfig.link : "";
    const showDriveLink = driveConfig.showDriveLink && Boolean(driveConfig.link);

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: clientName,
        business: business,
        instagram: client.instagram || "",
        reels: Number(client.reels || 0),
        plan: client.plan || "Monthly Subscription",
        billingModel: client.billingModel || "Subscription",
      },
      deliveries,
      driveLink,
      showDriveLink,
      passcodeHint: `${(clientName || business).toLowerCase().replace(/\s+/g, "")}@123`,
      validPasscodes: expectedPasscodes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load tracking data" },
      { status: 500 }
    );
  }
}
