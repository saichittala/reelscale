import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  createGenerationJob,
  createGenerationBatch,
  processNextJob,
  retryFailedJob,
  cancelJob,
  getQueueStats,
  getRecentJobs,
} from "../../../lib/queue/job-queue";
import { rewriteArticleSection } from "../../../lib/ai/ai-pipeline";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const limit = Number(searchParams.get("limit")) || 30;
  const view = searchParams.get("view");

  try {
    if (view === "history") {
      const sql = getDb();
      const history = await sql.query(
        `SELECT * FROM ai_execution_history ORDER BY created_at DESC LIMIT $1;`,
        [limit]
      );
      return NextResponse.json({ success: true, history });
    }

    if (view === "usage") {
      const sql = getDb();
      const usage = await sql.query(
        `SELECT * FROM ai_provider_usage ORDER BY created_at DESC LIMIT $1;`,
        [limit]
      );
      const aggregate = await sql.query(`
        SELECT
          COUNT(*) as total_requests,
          COALESCE(SUM(total_tokens), 0) as total_tokens,
          COALESCE(AVG(latency_ms), 0) as avg_latency_ms
        FROM ai_provider_usage;
      `);
      return NextResponse.json({
        success: true,
        usage,
        summary: {
          totalRequests: Number(aggregate[0]?.total_requests || 0),
          totalTokens: Number(aggregate[0]?.total_tokens || 0),
          avgLatencyMs: Math.round(Number(aggregate[0]?.avg_latency_ms || 0)),
        },
      });
    }

    const stats = await getQueueStats();
    const jobs = await getRecentJobs(limit, status);

    return NextResponse.json({
      success: true,
      stats,
      jobs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch jobs" },
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
    const { action, jobId, ...data } = body;

    switch (action) {
      case "generate-instant":
      case "generate-and-publish": {
        const { POST: generateHandler } = await import("../generate/route");
        return generateHandler(request);
      }

      case "create": {
        if (!data.title) {
          return NextResponse.json(
            { success: false, message: "Article title is required" },
            { status: 400 }
          );
        }
        const job = await createGenerationJob({
          title: data.title,
          category: data.category,
          slug: data.slug,
          priority: data.priority || 1,
        });

        // Trigger processing immediately in background
        processNextJob().catch(() => {});

        return NextResponse.json({
          success: true,
          message: `Generation job #${job.id} created and queued`,
          job,
        });
      }

      case "create-batch": {
        if (!Array.isArray(data.jobs) || data.jobs.length === 0) {
          return NextResponse.json(
            { success: false, message: "Jobs array is required" },
            { status: 400 }
          );
        }
        const result = await createGenerationBatch({
          batchName: data.batch_name || `Batch - ${Date.now()}`,
          jobs: data.jobs,
        });

        // Trigger worker in background
        processNextJob({ force: true }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: `Batch '${result.batch.batch_name}' created with ${result.jobs.length} jobs`,
          batch: result.batch,
          jobs: result.jobs,
        });
      }

      case "batch-schedule": {
        const targetQuantity = Number(data.count || data.quantity) || 5;
        const category = data.category || "Video Production";
        const { getActiveSchedule } = await import("../../../lib/scheduler/cron-scheduler");
        const schedule = await getActiveSchedule();
        const { getPublishedBlogsAsync } = await import("../../../lib/blog");
        const { getSeoTopics, researchAndSuggestTopics, filterOutDuplicateTopics } = await import("../../../lib/seo/topic-engine");

        const publishedBlogs = await getPublishedBlogsAsync().catch(() => []);
        let topics = await getSeoTopics("suggested");
        let uniqueTopics = filterOutDuplicateTopics(topics, publishedBlogs);

        if (uniqueTopics.length < targetQuantity) {
          try {
            await researchAndSuggestTopics(targetQuantity + 3);
            topics = await getSeoTopics("suggested");
            uniqueTopics = filterOutDuplicateTopics(topics, publishedBlogs);
          } catch {}
        }

        const selected = uniqueTopics.slice(0, targetQuantity);
        const jobsToCreate = selected.map((t) => ({
          title: t.title,
          category: t.category,
          topic_id: t.id,
        }));

        if (jobsToCreate.length === 0) {
          for (let i = 1; i <= targetQuantity; i++) {
            jobsToCreate.push({
              title: `High-Performance Instagram Reels for Hyderabad Businesses - Batch #${i}`,
              category,
              topic_id: undefined as any,
            });
          }
        }

        const result = await createGenerationBatch({
          batchName: `Manual Batch - ${new Date().toISOString().split("T")[0]}`,
          schedule_id: schedule?.id,
          jobs: jobsToCreate,
        });

        processNextJob({ force: true }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: `Batch '${result.batch.batch_name}' created with ${result.jobs.length} jobs`,
          batch: result.batch,
          jobs: result.jobs,
        });
      }

      case "process-next": {
        const processed = await processNextJob({ force: true });
        return NextResponse.json({
          success: true,
          message: processed
            ? `Successfully processed job #${processed.id}`
            : "No pending queued jobs found",
          job: processed,
        });
      }

      case "retry": {
        if (!jobId) {
          return NextResponse.json({ success: false, message: "Missing jobId" }, { status: 400 });
        }
        const retried = await retryFailedJob(jobId);
        processNextJob().catch(() => {});
        return NextResponse.json({
          success: true,
          message: `Job #${jobId} reset to queued`,
          job: retried,
        });
      }

      case "cancel": {
        if (!jobId) {
          return NextResponse.json({ success: false, message: "Missing jobId" }, { status: 400 });
        }
        const cancelled = await cancelJob(jobId);
        return NextResponse.json({
          success: true,
          message: `Job #${jobId} cancelled`,
          job: cancelled,
        });
      }

      case "rewrite-section": {
        if (!data.sectionTitle || !data.currentContent) {
          return NextResponse.json(
            { success: false, message: "Missing sectionTitle or currentContent" },
            { status: 400 }
          );
        }
        const rewritten = await rewriteArticleSection({
          sectionTitle: data.sectionTitle,
          currentContent: data.currentContent,
          instructions: data.instructions || "Improve readability and eliminate generic filler.",
          model: data.model,
        });
        return NextResponse.json({
          success: true,
          content: rewritten,
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
      { success: false, message: error.message || "Failed to process job action" },
      { status: 500 }
    );
  }
}
