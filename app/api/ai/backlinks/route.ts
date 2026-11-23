import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  getAllBacklinks,
  discoverBacklinkOpportunities,
  updateBacklinkOpportunity,
} from "../../../lib/seo/backlink-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";

  try {
    const backlinks = await getAllBacklinks(status);
    return NextResponse.json({ success: true, backlinks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load backlinks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    switch (action) {
      case "discover": {
        const discovered = await discoverBacklinkOpportunities({
          topicTitle: data.title,
          category: data.category,
        });
        const all = await getAllBacklinks("all");
        return NextResponse.json({
          success: true,
          message: `Discovered ${discovered.length} relevant backlink prospects`,
          discovered,
          all,
        });
      }

      case "update": {
        if (!id) {
          return NextResponse.json({ success: false, message: "Missing backlink id" }, { status: 400 });
        }
        const updated = await updateBacklinkOpportunity(Number(id), data);
        return NextResponse.json({
          success: true,
          message: "Backlink opportunity updated successfully",
          backlink: updated,
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unknown action '${action}'` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process backlink action" },
      { status: 500 }
    );
  }
}
