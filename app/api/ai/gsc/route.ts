import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  checkGscHealth,
  getGscPerformanceMetrics,
  auditIndexingReadiness,
} from "../../../lib/seo/gsc-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  try {
    if (view === "audit") {
      const audit = await auditIndexingReadiness();
      return NextResponse.json({ success: true, audit });
    }

    const health = await checkGscHealth();
    const metrics = await getGscPerformanceMetrics();

    return NextResponse.json({
      success: true,
      health,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load GSC data" },
      { status: 500 }
    );
  }
}
