import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { DeliveredReel } from "../../dashboard/types";

export const dynamic = "force-dynamic";

const DELIVERIES_FILE = join(process.cwd(), "content", "deliveries.json");
const MONTHLY_DRIVES_FILE = join(process.cwd(), "content", "monthly_drives.json");

function getDeliveries(): DeliveredReel[] {
  try {
    if (!existsSync(DELIVERIES_FILE)) {
      return [];
    }
    const content = readFileSync(DELIVERIES_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch (error) {
    console.error("Error reading deliveries:", error);
    return [];
  }
}

function saveDeliveries(deliveries: DeliveredReel[]): boolean {
  try {
    writeFileSync(DELIVERIES_FILE, JSON.stringify(deliveries, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving deliveries:", error);
    return false;
  }
}

function getDriveLinks(): Record<string, any> {
  try {
    if (!existsSync(MONTHLY_DRIVES_FILE)) {
      return {};
    }
    const content = readFileSync(MONTHLY_DRIVES_FILE, "utf-8");
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Error reading monthly drives:", error);
    return {};
  }
}

function saveDriveLinks(links: Record<string, any>): boolean {
  try {
    writeFileSync(MONTHLY_DRIVES_FILE, JSON.stringify(links, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving monthly drives:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const month = searchParams.get("month");

    let deliveries = getDeliveries();

    if (clientId) {
      deliveries = deliveries.filter(
        (d) => String(d.clientId) === String(clientId)
      );
    }

    if (month && month !== "all") {
      deliveries = deliveries.filter((d) => d.month === month);
    }

    // Sort by delivery date descending (most recent first)
    deliveries.sort((a, b) => (b.deliveredDate || "").localeCompare(a.deliveredDate || ""));

    // Retrieve monthly drive link if requested for specific client and month
    const driveLinks = getDriveLinks();
    const driveLinkKey = clientId && month ? `${clientId}_${month}` : "";
    let driveLink = "";
    let showDriveLink = true;

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

    return NextResponse.json({ success: true, deliveries, driveLink, showDriveLink });
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

    const deliveries = getDeliveries();

    switch (action) {
      case "setDriveLink": {
        if (!clientId || !month) {
          return NextResponse.json(
            { success: false, message: "clientId and month are required" },
            { status: 400 }
          );
        }
        const driveLinks = getDriveLinks();
        const key = `${clientId}_${month}`;
        const isShow = showDriveLink !== false;
        driveLinks[key] = {
          link: (driveLink || "").trim(),
          showDriveLink: isShow,
        };
        saveDriveLinks(driveLinks);
        return NextResponse.json({
          success: true,
          driveLink: driveLinks[key].link,
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
          clientId: delivery.clientId,
          month: delivery.month || (delivery.deliveredDate ? delivery.deliveredDate.slice(0, 7) : new Date().toISOString().slice(0, 7)),
          title: delivery.title.trim(),
          deliveredDate: delivery.deliveredDate || new Date().toISOString().slice(0, 10),
          link: delivery.link || "",
          status: delivery.status || "Delivered",
          notes: delivery.notes || "",
          createdAt: new Date().toISOString(),
        };

        deliveries.unshift(newDelivery);
        saveDeliveries(deliveries);

        return NextResponse.json({ success: true, delivery: newDelivery });
      }

      case "update": {
        if (!delivery || !delivery.id) {
          return NextResponse.json(
            { success: false, message: "Delivery ID is required for update" },
            { status: 400 }
          );
        }

        const index = deliveries.findIndex((d) => String(d.id) === String(delivery.id));
        if (index === -1) {
          return NextResponse.json(
            { success: false, message: "Delivery not found" },
            { status: 404 }
          );
        }

        deliveries[index] = {
          ...deliveries[index],
          ...delivery,
          month: delivery.month || (delivery.deliveredDate ? delivery.deliveredDate.slice(0, 7) : deliveries[index].month),
        };

        saveDeliveries(deliveries);
        return NextResponse.json({ success: true, delivery: deliveries[index] });
      }

      case "delete": {
        const targetId = id || delivery?.id;
        if (!targetId) {
          return NextResponse.json(
            { success: false, message: "ID is required for deletion" },
            { status: 400 }
          );
        }

        const filtered = deliveries.filter((d) => String(d.id) !== String(targetId));
        saveDeliveries(filtered);

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
