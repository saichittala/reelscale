import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { DeliveredReel } from "../../../dashboard/types";
import { getDb } from "../../../lib/db";
import { redisGet, redisSet } from "../../../lib/redis";

export const dynamic = "force-dynamic";

const REDIS_TRACK_PREFIX = "neon:track:";

const DELIVERIES_FILE = join(process.cwd(), "content", "deliveries.json");
const MONTHLY_DRIVES_FILE = join(process.cwd(), "content", "monthly_drives.json");

function getFileDeliveries(): DeliveredReel[] {
  try {
    if (!existsSync(DELIVERIES_FILE)) return [];
    const content = readFileSync(DELIVERIES_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

function getFileMonthlyDrive(clientId: string | number, month?: string | null): { link: string; showDriveLink: boolean } {
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

    // Check Redis cache for Neon tracking portal
    const trackCacheKey = `${REDIS_TRACK_PREFIX}${id}:${month || "all"}`;
    const cached = await redisGet<any>(trackCacheKey);
    if (cached && cached.success) {
      return NextResponse.json(cached);
    }

    // Fetch client from Neon Postgres
    let client: any = null;
    let deliveries: DeliveredReel[] = [];
    let driveLink = "";
    let showDriveLink = true;

    try {
      const sql = getDb();
      const rows = await sql`
        SELECT id, name, business, phone, instagram, reels, billing_model, plan
        FROM clients
        WHERE id = ${Number(id)}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        client = rows[0];
      }

      // Fetch deliveries from Neon
      let delRows: any[] = [];
      if (month && month !== "all") {
        delRows = await sql`
          SELECT id, client_id, month, title, delivered_date, link, status, notes, created_at
          FROM deliveries
          WHERE client_id = ${Number(id)} AND month = ${month}
          ORDER BY delivered_date DESC, created_at DESC;
        `;
      } else {
        delRows = await sql`
          SELECT id, client_id, month, title, delivered_date, link, status, notes, created_at
          FROM deliveries
          WHERE client_id = ${Number(id)}
          ORDER BY delivered_date DESC, created_at DESC;
        `;
      }

      deliveries = delRows.map((r: any) => ({
        id: r.id,
        clientId: Number(r.client_id),
        month: r.month,
        title: r.title,
        deliveredDate: r.delivered_date,
        link: r.link || "",
        status: r.status || "Delivered",
        notes: r.notes || "",
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      }));

      // Fetch drive link from Neon
      if (month && month !== "all") {
        const driveRows = await sql`
          SELECT link, show_drive_link
          FROM monthly_drives
          WHERE client_id = ${Number(id)} AND month = ${month}
          LIMIT 1;
        `;
        if (driveRows.length > 0) {
          driveLink = driveRows[0].link || "";
          showDriveLink = driveRows[0].show_drive_link !== false;
        }
      }
    } catch (e) {
      console.warn("Could not query Neon Postgres for track endpoint:", e);
      // Fallback to file deliveries
      deliveries = getFileDeliveries().filter((d) => String(d.clientId) === String(id));
      if (month && month !== "all") {
        deliveries = deliveries.filter((d) => d.month === month);
      }
      deliveries.sort((a, b) => (b.deliveredDate || "").localeCompare(a.deliveredDate || ""));

      const fileDrive = getFileMonthlyDrive(id, month);
      driveLink = fileDrive.link;
      showDriveLink = fileDrive.showDriveLink;
    }

    if (!client) {
      return NextResponse.json(
        { success: false, message: "Client tracking portal not found" },
        { status: 404 }
      );
    }

    // Sanitize client details for public/portal view (no financial rates)
    const clientName = client.name || "";
    const business = client.business || "";

    // Normalized passcodes (e.g. client name + @123)
    const expectedPasscodes = [
      `${clientName.toLowerCase().trim()}@123`,
      `${clientName.toLowerCase().replace(/\s+/g, "")}@123`,
      `${business.toLowerCase().trim()}@123`,
      `${business.toLowerCase().replace(/\s+/g, "")}@123`,
    ].filter(Boolean);

    const responseData = {
      success: true,
      client: {
        id: client.id,
        name: clientName,
        business: business,
        phone: client.phone || "",
        instagram: client.instagram || "",
        reels: Number(client.reels || 0),
        billingModel: client.billing_model || "Subscription",
        plan: client.plan || "",
        expectedPasscodes,
        deliveries,
        driveLink,
        showDriveLink,
      },
      deliveries,
      driveLink,
      showDriveLink,
      validPasscodes: expectedPasscodes,
    };

    await redisSet(trackCacheKey, responseData, 300);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load tracking data" },
      { status: 500 }
    );
  }
}
