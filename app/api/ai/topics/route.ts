import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  getSeoTopics,
  researchAndSuggestTopics,
  updateTopicStatus,
  getExistingContentCatalog,
} from "../../../lib/seo/topic-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const action = searchParams.get("action");

  try {
    if (action === "catalog") {
      const catalog = await getExistingContentCatalog();
      return NextResponse.json({ success: true, catalog });
    }

    const topics = await getSeoTopics(status);
    if (status === "suggested") {
      const { getPublishedBlogsAsync } = await import("../../../lib/blog");
      const { filterOutDuplicateTopics } = await import("../../../lib/seo/topic-engine");
      const publishedBlogs = await getPublishedBlogsAsync().catch(() => []);
      const uniqueTopics = filterOutDuplicateTopics(topics, publishedBlogs);
      return NextResponse.json({ success: true, topics: uniqueTopics });
    }
    return NextResponse.json({ success: true, topics });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, count, topicId, status } = body;

    switch (action) {
      case "research": {
        const targetCount = Number(count) || 5;
        const newTopics = await researchAndSuggestTopics(targetCount);
        const allTopics = await getSeoTopics("all");
        return NextResponse.json({
          success: true,
          message: `Discovered and proposed ${newTopics.length} new content gap topics`,
          newTopics,
          allTopics,
        });
      }

      case "update-status": {
        if (!topicId || !status) {
          return NextResponse.json(
            { success: false, message: "Missing topicId or status" },
            { status: 400 }
          );
        }
        const updated = await updateTopicStatus(Number(topicId), status);
        return NextResponse.json({
          success: true,
          message: `Topic status updated to ${status}`,
          topic: updated,
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
      { success: false, message: error.message || "Failed to process topic action" },
      { status: 500 }
    );
  }
}
