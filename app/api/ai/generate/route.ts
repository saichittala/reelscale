import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import { executeMultiStageBlogGeneration } from "../../../lib/ai/ai-pipeline";
import { syncBlogToSanity } from "../../../sanity/blog-sync";
import {
  getSeoTopics,
  researchAndSuggestTopics,
  isHeadlineDuplicate,
  getUniqueNextTopic,
} from "../../../lib/seo/topic-engine";
import { getPublishedBlogsAsync } from "../../../lib/blog";
import { redisInvalidatePattern } from "../../../lib/redis";
import { getDb } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import { Blog } from "../../../dashboard/types";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { logExecutionHistory } from "../../../lib/queue/job-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient execution window for 8-stage pipeline

const DB_PATH = join(process.cwd(), "content", "blogs.json");

function updateLocalBlogsCache(newBlog: Blog) {
  try {
    let blogs: Blog[] = [];
    if (existsSync(DB_PATH)) {
      const content = readFileSync(DB_PATH, "utf8");
      blogs = JSON.parse(content || "[]");
    }
    const filtered = blogs.filter(
      (b) => b.slug !== newBlog.slug && b.id !== newBlog.id
    );
    filtered.unshift(newBlog);
    writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to update local content/blogs.json cache:", e);
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json(
      { success: false, message: "Forbidden: You do not have permission to generate blogs" },
      { status: 403 }
    );
  }

  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    let {
      title,
      category,
      primary_keyword,
      model,
      topic_id,
      publish_directly = true,
    } = body;

    // Deduplication check: verify headline against all existing published/posted blogs
    const publishedBlogs = await getPublishedBlogsAsync().catch(() => []);
    let selectedTopicId = topic_id;
    const isDuplicate = title && title.trim() ? isHeadlineDuplicate(title.trim(), publishedBlogs) : false;

    // If title was not provided OR matches an existing published blog, automatically pick a fresh unique topic
    if (!title || !title.trim() || isDuplicate) {
      if (isDuplicate) {
        console.log(`[Generate] Headline "${title}" matches an already published blog. Fetching alternative unique topic...`);
      }
      try {
        const uniqueTopic = await getUniqueNextTopic(
          publishedBlogs,
          isDuplicate ? undefined : title,
          category
        );
        title = uniqueTopic.title;
        category = uniqueTopic.category || category || "Video Production";
        primary_keyword = uniqueTopic.primary_keyword || primary_keyword;
        selectedTopicId = uniqueTopic.topic_id;
      } catch (err: any) {
        console.warn("Notice checking SEO topics for auto-selection:", err?.message);
      }
    }

    const targetTitle = (title && title.trim())
      ? title.trim()
      : "High-Performance Instagram Reels for Hyderabad Businesses: Production Guide";
    const targetCategory = category || "Video Production";

    // Execute Multi-stage AI Generation Pipeline (8 stages: Intent, Outline, Content, Linking, Sourced Image, Validation)
    const result = await executeMultiStageBlogGeneration({
      topicTitle: targetTitle,
      category: targetCategory,
      primaryKeyword: primary_keyword,
      model,
    });

    const execTimeMs = Date.now() - startTime;
    const today = new Date().toISOString().split("T")[0];

    // Force "Published" status if publish_directly is true (default for manual AI generation)
    const blogToSave: Blog = {
      ...result.blog,
      status: publish_directly ? "Published" : "Draft",
      publishedDate: today,
      updatedDate: today,
    };

    // 1. Sync directly to Sanity Content Lake
    let syncedBlog = blogToSave;
    let sanityDocId: string | null = null;
    try {
      syncedBlog = await syncBlogToSanity(blogToSave);
      sanityDocId = syncedBlog.id ? String(syncedBlog.id) : null;
    } catch (sanityErr: any) {
      console.warn("Sanity sync notice during manual AI generation:", sanityErr?.message || sanityErr);
    }

    // 2. Synchronize to local fallback database file
    updateLocalBlogsCache(syncedBlog);

    // 3. Invalidate Redis caches so published blog is immediately live
    try {
      await redisInvalidatePattern("sanity:*");
      await redisInvalidatePattern("sanity:blogs:*");
    } catch {
      // Non-blocking
    }

    // 4. Trigger Next.js on-demand ISR revalidation for production paths
    try {
      revalidatePath("/blog", "page");
      if (syncedBlog.slug) {
        revalidatePath(`/blog/${syncedBlog.slug}`, "page");
      }
      revalidatePath("/", "layout");
    } catch {
      // Non-blocking
    }

    // 5. Update SEO topic status to published (skip verbose AI job database logging as requested)
    if (selectedTopicId) {
      try {
        const sql = getDb();
        await sql.query(
          `UPDATE seo_topics SET status = 'published', updated_at = NOW() WHERE id = $1;`,
          [selectedTopicId]
        );
      } catch {}

      try {
        const { updateTopicStatus } = await import("../../../lib/seo/topic-engine");
        await updateTopicStatus(Number(selectedTopicId), "published");
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: `Blog "${syncedBlog.title}" generated and published directly to production!`,
      blog: syncedBlog,
      validation: result.validationReport,
      tokensUsed: result.tokensUsed,
      executionTimeMs: execTimeMs,
      liveUrl: `https://reelscale.in/blog/${syncedBlog.slug}`,
    });
  } catch (error: any) {
    console.error("AI Generation & Publish Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate and publish blog",
      },
      { status: 500 }
    );
  }
}
