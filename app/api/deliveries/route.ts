import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { DeliveredReel } from "../../dashboard/types";
import { getDb } from "../../lib/db";
import { redisGet, redisSet, redisInvalidatePattern } from "../../lib/redis";

export const dynamic = "force-dynamic";

const REDIS_DELIVERIES_PREFIX = "neon:deliveries:";

async function invalidateDeliveryCache() {
  await Promise.all([
    redisInvalidatePattern("neon:deliveries:*"),
    redisInvalidatePattern("neon:track:*"),
  ]);
}

const DELIVERIES_FILE = join(process.cwd(), "content", "deliveries.json");
const MONTHLY_DRIVES_FILE = join(process.cwd(), "content", "monthly_drives.json");

function getFileDeliveries(): DeliveredReel[] {
  try {
    if (!existsSync(DELIVERIES_FILE)) return [];
    const content = readFileSync(DELIVERIES_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch (error) {
    console.error("Error reading deliveries file:", error);
    return [];
  }
}

function saveFileDeliveries(deliveries: DeliveredReel[]): boolean {
  try {
    writeFileSync(DELIVERIES_FILE, JSON.stringify(deliveries, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving deliveries file:", error);
    return false;
  }
}

function getFileDriveLinks(): Record<string, any> {
  try {
    if (!existsSync(MONTHLY_DRIVES_FILE)) return {};
    const content = readFileSync(MONTHLY_DRIVES_FILE, "utf-8");
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Error reading monthly drives file:", error);
    return {};
  }
}

function saveFileDriveLinks(links: Record<string, any>): boolean {
  try {
    writeFileSync(MONTHLY_DRIVES_FILE, JSON.stringify(links, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving monthly drives file:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const month = searchParams.get("month");

    // Check Redis cache for Neon deliveries
    const cacheKey = `${REDIS_DELIVERIES_PREFIX}${clientId || "all"}:${month || "all"}`;
    const cached = await redisGet<{ success: boolean; deliveries: DeliveredReel[]; driveLink: string; showDriveLink: boolean }>(cacheKey);
    if (cached && Array.isArray(cached.deliveries)) {
      return NextResponse.json(cached);
    }

    let deliveries: DeliveredReel[] = [];
    let driveLink = "";
    let showDriveLink = true;

    // 1. Try Neon Postgres
    try {
      const sql = getDb();
      let rows: any[] = [];
      if (clientId && month && month !== "all") {
        rows = await sql`
          SELECT id, client_id, month, title, delivered_date, link, status, notes, created_at
          FROM deliveries
          WHERE client_id = ${Number(clientId)} AND month = ${month}
          ORDER BY delivered_date DESC, created_at DESC;
        `;
      } else if (clientId) {
        rows = await sql`
          SELECT id, client_id, month, title, delivered_date, link, status, notes, created_at
          FROM deliveries
          WHERE client_id = ${Number(clientId)}
          ORDER BY delivered_date DESC, created_at DESC;
        `;
      } else if (month && month !== "all") {
        rows = await sql`
          SELECT id, client_id, month, title, delivered_date, link, status, notes, created_at
          FROM deliveries
          WHERE month = ${month}
          ORDER BY delivered_date DESC, created_at DESC;
        `;
      } else {
        rows = await sql`
          SELECT id, client_id, month, title, delivered_date, link, status, notes, created_at
          FROM deliveries
          ORDER BY delivered_date DESC, created_at DESC;
        `;
      }

      deliveries = rows.map((r: any) => ({
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

      // Query monthly_drives if clientId and month provided
      if (clientId && month && month !== "all") {
        const driveRows = await sql`
          SELECT link, show_drive_link
          FROM monthly_drives
          WHERE client_id = ${Number(clientId)} AND month = ${month}
          LIMIT 1;
        `;
        if (driveRows.length > 0) {
          driveLink = driveRows[0].link || "";
          showDriveLink = driveRows[0].show_drive_link !== false;
        }
      }
    } catch (dbErr) {
      console.warn("Neon DB error in deliveries GET, using file backup:", dbErr);
      deliveries = getFileDeliveries();

      if (clientId) {
        deliveries = deliveries.filter((d) => String(d.clientId) === String(clientId));
      }
      if (month && month !== "all") {
        deliveries = deliveries.filter((d) => d.month === month);
      }
      deliveries.sort((a, b) => (b.deliveredDate || "").localeCompare(a.deliveredDate || ""));

      const driveLinks = getFileDriveLinks();
      const driveLinkKey = clientId && month ? `${clientId}_${month}` : "";
      if (driveLinkKey && driveLinks[driveLinkKey]) {
        const entry: any = driveLinks[driveLinkKey];
        if (typeof entry === "string") {
          driveLink = entry;
          showDriveLink = true;
        } else if (entry && typeof entry === "object") {
          driveLink = entry.link || "";
          showDriveLink = entry.showDriveLink !== false;
        }
      }
    }

    const result = { success: true, deliveries, driveLink, showDriveLink };
    await redisSet(cacheKey, result, 3600);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, delivery, id, clientId, month, driveLink, showDriveLink } = body;

    switch (action) {
      case "setDriveLink": {
        if (!clientId || !month) {
          return NextResponse.json(
            { success: false, message: "clientId and month are required" },
            { status: 400 }
          );
        }
        const isShow = showDriveLink !== false;
        const linkVal = (driveLink || "").trim();

        // Save to Neon Postgres
        try {
          const sql = getDb();
          await sql`
            INSERT INTO monthly_drives (client_id, month, link, show_drive_link, updated_at)
            VALUES (${Number(clientId)}, ${month}, ${linkVal}, ${isShow}, NOW())
            ON CONFLICT (client_id, month) DO UPDATE SET
              link = EXCLUDED.link,
              show_drive_link = EXCLUDED.show_drive_link,
              updated_at = NOW();
          `;
        } catch (dbErr) {
          console.warn("Could not save drive link to Neon DB:", dbErr);
        }

        // File sync backup
        const driveLinks = getFileDriveLinks();
        driveLinks[`${clientId}_${month}`] = { link: linkVal, showDriveLink: isShow };
        saveFileDriveLinks(driveLinks);

        await invalidateDeliveryCache();

        return NextResponse.json({
          success: true,
          driveLink: linkVal,
          showDriveLink: isShow,
        });
      }

      case "add": {
        if (!delivery || !delivery.clientId || !delivery.title) {
          return NextResponse.json(
            { success: false, message: "Missing required delivery fields" },
            { status: 400 }
          );
        }

        const newDelivery: DeliveredReel = {
          id: delivery.id || `del-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          clientId: Number(delivery.clientId),
          month: delivery.month || (delivery.deliveredDate ? delivery.deliveredDate.slice(0, 7) : new Date().toISOString().slice(0, 7)),
          title: delivery.title.trim(),
          deliveredDate: delivery.deliveredDate || new Date().toISOString().slice(0, 10),
          link: delivery.link || "",
          status: delivery.status || "Delivered",
          notes: delivery.notes || "",
          createdAt: new Date().toISOString(),
        };

        // Save to Neon Postgres
        try {
          const sql = getDb();
          await sql`
            INSERT INTO deliveries (id, client_id, month, title, delivered_date, link, status, notes, created_at, updated_at)
            VALUES (${newDelivery.id}, ${Number(newDelivery.clientId)}, ${newDelivery.month}, ${newDelivery.title}, ${newDelivery.deliveredDate}, ${newDelivery.link || ""}, ${newDelivery.status || "Delivered"}, ${newDelivery.notes || ""}, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              month = EXCLUDED.month,
              title = EXCLUDED.title,
              delivered_date = EXCLUDED.delivered_date,
              link = EXCLUDED.link,
              status = EXCLUDED.status,
              notes = EXCLUDED.notes,
              updated_at = NOW();
          `;
        } catch (dbErr) {
          console.warn("Could not insert delivery into Neon DB:", dbErr);
        }

        // File sync backup
        const fileDeliveries = getFileDeliveries();
        fileDeliveries.unshift(newDelivery);
        saveFileDeliveries(fileDeliveries);

        await invalidateDeliveryCache();

        return NextResponse.json({ success: true, delivery: newDelivery });
      }

      case "update": {
        if (!delivery || !delivery.id) {
          return NextResponse.json(
            { success: false, message: "Delivery ID is required for update" },
            { status: 400 }
          );
        }

        const targetMonth = delivery.month || (delivery.deliveredDate ? delivery.deliveredDate.slice(0, 7) : undefined);

        // Update in Neon Postgres
        try {
          const sql = getDb();
          await sql`
            UPDATE deliveries
            SET
              title = COALESCE(${delivery.title ? delivery.title.trim() : null}, title),
              delivered_date = COALESCE(${delivery.deliveredDate || null}, delivered_date),
              month = COALESCE(${targetMonth || null}, month),
              link = COALESCE(${delivery.link !== undefined ? delivery.link : null}, link),
              status = COALESCE(${delivery.status || null}, status),
              notes = COALESCE(${delivery.notes !== undefined ? delivery.notes : null}, notes),
              updated_at = NOW()
            WHERE id = ${String(delivery.id)};
          `;
        } catch (dbErr) {
          console.warn("Could not update delivery in Neon DB:", dbErr);
        }

        // File sync backup
        const fileDeliveries = getFileDeliveries();
        const index = fileDeliveries.findIndex((d) => String(d.id) === String(delivery.id));
        if (index !== -1) {
          fileDeliveries[index] = {
            ...fileDeliveries[index],
            ...delivery,
            month: targetMonth || fileDeliveries[index].month,
          };
          saveFileDeliveries(fileDeliveries);
          await invalidateDeliveryCache();
          return NextResponse.json({ success: true, delivery: fileDeliveries[index] });
        }

        await invalidateDeliveryCache();
        return NextResponse.json({ success: true, delivery });
      }

      case "delete": {
        const targetId = id || delivery?.id;
        if (!targetId) {
          return NextResponse.json(
            { success: false, message: "ID is required for deletion" },
            { status: 400 }
          );
        }

        // Delete from Neon Postgres
        try {
          const sql = getDb();
          await sql`
            DELETE FROM deliveries
            WHERE id = ${String(targetId)};
          `;
        } catch (dbErr) {
          console.warn("Could not delete delivery from Neon DB:", dbErr);
        }

        // File sync backup
        const fileDeliveries = getFileDeliveries();
        const filtered = fileDeliveries.filter((d) => String(d.id) !== String(targetId));
        saveFileDeliveries(filtered);

        await invalidateDeliveryCache();

        return NextResponse.json({ success: true, message: "Deleted successfully" });
      }

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
