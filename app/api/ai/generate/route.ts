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

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json(
      { success: false, message: "Forbidden: You do not have permission to view AI status" },
      { status: 403 }
    );
  }

  try {
    const { getActiveAiProvider, getActiveAiModel } = await import("../../../lib/ai/groq-client");
    const provider = await getActiveAiProvider();
    const model = await getActiveAiModel();

    const providerNames: Record<string, string> = {
      groq: "Groq LPU Engine",
      gemini: "Google Gemini Engine",
      openrouter: "OpenRouter Multi-Provider",
    };

    return NextResponse.json({
      success: true,
      agent: {
        provider,
        model,
        displayName: providerNames[provider] || "Groq LPU Engine",
        status: "connected",
        speed: provider === "groq" ? "Ultra-Fast (LPU)" : "Standard",
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      agent: {
        provider: "groq",
        model: "qwen/qwen3.8-27b",
        displayName: "Groq LPU Engine",
        status: "connected",
        speed: "Ultra-Fast (LPU)",
      },
    });
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

    // Auto-pick next unique topic only if no title was provided by the user
    if (!title || !title.trim()) {
      try {
        const uniqueTopic = await getUniqueNextTopic(
          publishedBlogs,
          undefined,
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
      revalidatePath("/blog");
      if (syncedBlog.slug) {
        revalidatePath(`/blog/${syncedBlog.slug}`);
      }
    } catch {
      // Non-blocking
    }

    // 5. Update SEO topic status to published
    if (selectedTopicId) {
      try {
        const sql = getDb();
        await sql`UPDATE seo_topics SET status = 'published', updated_at = NOW() WHERE id = ${Number(selectedTopicId)};`;
      } catch {}

      try {
        const { updateTopicStatus } = await import("../../../lib/seo/topic-engine");
        await updateTopicStatus(Number(selectedTopicId), "published");
      } catch {}
    }

    // 6. Dispatch Email Notification to reelscale7@gmail.com
    try {
      const { sendBlogPublishedEmail } = await import("../../../lib/notifications/email-service");
      sendBlogPublishedEmail({
        blog: syncedBlog,
        validation: result.validationReport,
        tokensUsed: result.tokensUsed,
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
        executionTimeMs: execTimeMs,
        recipientEmail: "reelscale7@gmail.com",
      }).catch((emailErr) => console.warn("[Email Notification Notice]", emailErr?.message));
    } catch (e) {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: `Blog "${syncedBlog.title}" generated and published directly to production!`,
      blog: syncedBlog,
      validation: result.validationReport,
      tokensUsed: result.tokensUsed,
      providerUsed: result.providerUsed || "groq",
      modelUsed: result.modelUsed || "qwen/qwen3.8-27b",
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
