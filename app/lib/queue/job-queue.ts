import { getDb } from "../db";
import { executeMultiStageBlogGeneration } from "../ai/ai-pipeline";
import { syncBlogToSanity } from "../../sanity/blog-sync";
import { saveAiJobToSanity, getAiJobsFromSanity } from "../../sanity/ai-sync";
import { Blog } from "../../dashboard/types";
import { slugify } from "../blog-utils";

export interface GenerationJobRow {
  id: string;
  batch_id?: string | null;
  topic_id?: number | null;
  title: string;
  slug: string;
  category: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  priority: number;
  stage: string;
  attempts: number;
  max_attempts: number;
  error_message?: string | null;
  article_data?: any;
  sanity_document_id?: string | null;
  validation_results?: any;
  tokens_used: number;
  execution_time_ms: number;
  scheduled_for: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationBatchRow {
  id: string;
  schedule_id?: number | null;
  batch_name: string;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  status: "pending" | "processing" | "completed" | "partial_failure" | "failed" | "cancelled";
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

// Concurrency lock so single node server doesn't execute multiple heavy jobs simultaneously
let isWorkerRunning = false;

export async function createGenerationJob(params: {
  title: string;
  category?: string;
  slug?: string;
  batch_id?: string;
  topic_id?: number;
  priority?: number;
  scheduled_for?: Date;
}): Promise<GenerationJobRow> {
  const slug = params.slug ? slugify(params.slug) : slugify(params.title);
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  let jobRow: GenerationJobRow = {
    id: jobId,
    batch_id: params.batch_id || null,
    topic_id: params.topic_id || null,
    title: params.title,
    slug,
    category: params.category || "Video Production",
    status: "queued",
    priority: params.priority || 1,
    stage: "queued",
    attempts: 0,
    max_attempts: 3,
    tokens_used: 0,
    execution_time_ms: 0,
    scheduled_for: (params.scheduled_for || new Date()).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Sync to Sanity Content Lake
  await saveAiJobToSanity(jobRow as any).catch(() => { });

  // Sync to Neon DB if available
  try {
    const sql = getDb();
    const existing = await sql.query(
      `SELECT id, status FROM ai_generation_jobs WHERE slug = $1 AND status IN ('queued', 'processing') LIMIT 1;`,
      [slug]
    );
    if (existing.length > 0) {
      throw new Error(`A generation job for slug '${slug}' is already active (Job ID: ${existing[0].id})`);
    }

    const rows = await sql.query(
      `INSERT INTO ai_generation_jobs (
        id, batch_id, topic_id, title, slug, category, status, priority, stage, scheduled_for
      ) VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7, 'queued', $8)
      RETURNING *;`,
      [
        jobId,
        params.batch_id || null,
        params.topic_id || null,
        params.title,
        slug,
        params.category || "Video Production",
        params.priority || 1,
        params.scheduled_for || new Date(),
      ]
    );
    if (rows.length > 0) jobRow = rows[0] as GenerationJobRow;
  } catch (dbErr: any) {
    if (dbErr.message?.includes("already active")) throw dbErr;
  }

  await logExecutionHistory(jobId, "job_created", "queued", `Job queued for title: "${params.title}"`);
  return jobRow;
}

export async function createGenerationBatch(params: {
  batchName: string;
  jobs: { title: string; category?: string; topic_id?: number }[];
  schedule_id?: number;
}): Promise<{ batch: GenerationBatchRow; jobs: GenerationJobRow[] }> {
  const sql = getDb();
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const batchRows = await sql.query(
    `INSERT INTO ai_generation_batches (
      id, schedule_id, batch_name, total_jobs, completed_jobs, failed_jobs, status
    ) VALUES ($1, $2, $3, $4, 0, 0, 'pending')
    RETURNING *;`,
    [batchId, params.schedule_id || null, params.batchName, params.jobs.length]
  );

  const createdJobs: GenerationJobRow[] = [];
  for (const j of params.jobs) {
    try {
      const job = await createGenerationJob({
        title: j.title,
        category: j.category,
        topic_id: j.topic_id,
        batch_id: batchId,
      });
      createdJobs.push(job);
    } catch (err: any) {
      console.warn(`Skipping duplicate or invalid job in batch: ${j.title}`, err.message);
    }
  }

  // Update total_jobs if some skipped
  if (createdJobs.length !== params.jobs.length) {
    await sql.query(
      `UPDATE ai_generation_batches SET total_jobs = $1 WHERE id = $2;`,
      [createdJobs.length, batchId]
    );
  }

  return { batch: batchRows[0] as GenerationBatchRow, jobs: createdJobs };
}

export async function processNextJob(options?: { force?: boolean }): Promise<GenerationJobRow | null> {
  if (isWorkerRunning) return null;
  const sql = getDb();

  // If not manually forced, check if automation is paused globally or inactive
  if (!options?.force) {
    try {
      const { getAiSettingsFromSanity, getAiScheduleFromSanity } = await import("../../sanity/ai-sync");
      const [settings, sanitySchedule] = await Promise.all([
        getAiSettingsFromSanity().catch(() => null),
        getAiScheduleFromSanity().catch(() => null),
      ]);
      if (settings && (settings.is_paused || !settings.is_enabled)) {
        return null;
      }
      if (sanitySchedule && !sanitySchedule.is_active) {
        return null;
      }
    } catch {}

    try {
      const settingsRows = await sql.query(`SELECT is_enabled, is_paused FROM ai_automation_settings LIMIT 1;`);
      if (settingsRows.length > 0) {
        if (!settingsRows[0].is_enabled || settingsRows[0].is_paused) {
          return null;
        }
      }
      const scheduleRows = await sql.query(`SELECT is_active FROM ai_schedule_configs WHERE id = 1 LIMIT 1;`);
      if (scheduleRows.length > 0) {
        if (!scheduleRows[0].is_active) {
          return null;
        }
      }
    } catch {}
  }

  // Find next queued job scheduled for now or earlier
  const queuedRows = await sql.query(
    `SELECT * FROM ai_generation_jobs
     WHERE status = 'queued' AND scheduled_for <= NOW()
     ORDER BY priority DESC, created_at ASC
     LIMIT 1;`
  );

  if (queuedRows.length === 0) return null;
  const job = queuedRows[0] as GenerationJobRow;

  // Mark as processing
  isWorkerRunning = true;
  await sql.query(
    `UPDATE ai_generation_jobs
     SET status = 'processing', stage = 'starting', started_at = NOW(), attempts = attempts + 1, updated_at = NOW()
     WHERE id = $1;`,
    [job.id]
  );

  if (job.batch_id) {
    await sql.query(
      `UPDATE ai_generation_batches SET status = 'processing', started_at = COALESCE(started_at, NOW()) WHERE id = $1;`,
      [job.batch_id]
    );
  }

  const startTime = Date.now();
  try {
    await logExecutionHistory(job.id, "job_started", "processing", `Starting generation for "${job.title}"`);

    const result = await executeMultiStageBlogGeneration(
      {
        topicTitle: job.title,
        category: job.category,
      },
      async (stage, msg) => {
        await sql.query(
          `UPDATE ai_generation_jobs SET stage = $1, updated_at = NOW() WHERE id = $2;`,
          [stage, job.id]
        );
        await logExecutionHistory(job.id, stage, "processing", msg);
      }
    );

    const execTimeMs = Date.now() - startTime;

    // Check automation settings to see if auto-publish is active
    const settings = await sql.query("SELECT auto_publish FROM ai_automation_settings LIMIT 1;");
    const autoPublish = Boolean(settings[0]?.auto_publish);

    const blogToSave: Blog = {
      ...result.blog,
      status: autoPublish && result.validationReport.status === "passed" ? "Published" : "Draft",
    };

    // Sync generated article to Sanity
    let sanityDocId: string | null = null;
    try {
      const synced = await syncBlogToSanity(blogToSave);
      sanityDocId = synced.id ? String(synced.id) : null;
    } catch (sanityErr: any) {
      console.warn("Failed to sync generated blog to Sanity, saved locally in PostgreSQL:", sanityErr.message);
    }

    // Mark job as completed
    const completedJobRows = await sql.query(
      `UPDATE ai_generation_jobs
       SET status = 'completed',
           stage = 'completed',
           article_data = $1,
           sanity_document_id = $2,
           validation_results = $3,
           tokens_used = $4,
           execution_time_ms = $5,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *;`,
      [
        JSON.stringify(blogToSave),
        sanityDocId,
        JSON.stringify(result.validationReport),
        result.tokensUsed,
        execTimeMs,
        job.id,
      ]
    );

    // If associated with a topic, mark topic as published or generating
    if (job.topic_id) {
      await sql.query(
        `UPDATE seo_topics SET status = 'published', updated_at = NOW() WHERE id = $1;`,
        [job.topic_id]
      );
    }

    // Update batch counter
    if (job.batch_id) {
      await sql.query(
        `UPDATE ai_generation_batches
         SET completed_jobs = completed_jobs + 1
         WHERE id = $1;`,
        [job.batch_id]
      );
      await checkAndFinalizeBatch(job.batch_id);
    }

    await logExecutionHistory(
      job.id,
      "job_completed",
      "completed",
      `Successfully generated article (${result.validationReport.wordCount} words, SEO score: ${result.validationReport.overallScore}/100)`
    );

    return completedJobRows[0] as GenerationJobRow;
  } catch (err: any) {
    const execTimeMs = Date.now() - startTime;
    const isRetryable = job.attempts < job.max_attempts;
    const nextStatus = isRetryable ? "queued" : "failed";

    await sql.query(
      `UPDATE ai_generation_jobs
       SET status = $1,
           stage = 'error',
           error_message = $2,
           execution_time_ms = $3,
           updated_at = NOW()
       WHERE id = $4;`,
      [nextStatus, err.message || "Generation error", execTimeMs, job.id]
    );

    if (job.batch_id && !isRetryable) {
      await sql.query(
        `UPDATE ai_generation_batches SET failed_jobs = failed_jobs + 1 WHERE id = $1;`,
        [job.batch_id]
      );
      await checkAndFinalizeBatch(job.batch_id);
    }

    await logExecutionHistory(
      job.id,
      "job_error",
      nextStatus,
      `Generation failed: ${err.message}. ${isRetryable ? `Will retry (attempt ${job.attempts}/${job.max_attempts})` : "Max attempts reached."}`
    );

    return null;
  } finally {
    isWorkerRunning = false;
  }
}

async function checkAndFinalizeBatch(batchId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ai_generation_batches WHERE id = $1;`, [batchId]);
  if (rows.length === 0) return;
  const b = rows[0] as GenerationBatchRow;

  if (b.completed_jobs + b.failed_jobs >= b.total_jobs) {
    const finalStatus =
      b.failed_jobs === 0
        ? "completed"
        : b.completed_jobs > 0
          ? "partial_failure"
          : "failed";

    await sql.query(
      `UPDATE ai_generation_batches
       SET status = $1, completed_at = NOW()
       WHERE id = $2;`,
      [finalStatus, batchId]
    );
  }
}

export async function retryFailedJob(jobId: string): Promise<GenerationJobRow> {
  const sql = getDb();
  const rows = await sql.query(
    `UPDATE ai_generation_jobs
     SET status = 'queued', stage = 'queued', attempts = 0, error_message = NULL, scheduled_for = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *;`,
    [jobId]
  );
  if (rows.length === 0) throw new Error(`Job '${jobId}' not found`);
  await logExecutionHistory(jobId, "job_retry", "queued", "Job manually requeued by administrator");
  return rows[0] as GenerationJobRow;
}

export async function cancelJob(jobId: string): Promise<GenerationJobRow> {
  const sql = getDb();
  const rows = await sql.query(
    `UPDATE ai_generation_jobs
     SET status = 'cancelled', stage = 'cancelled', updated_at = NOW()
     WHERE id = $1
     RETURNING *;`,
    [jobId]
  );
  if (rows.length === 0) throw new Error(`Job '${jobId}' not found`);
  await logExecutionHistory(jobId, "job_cancelled", "cancelled", "Job cancelled by administrator");
  return rows[0] as GenerationJobRow;
}

export async function getQueueStats(): Promise<{
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  todayCompleted: number;
  todayTokensUsed: number;
}> {
  try {
    const sql = getDb();
    const counts = await sql.query(`
      SELECT status, COUNT(*) as count
      FROM ai_generation_jobs
      GROUP BY status;
    `);

    const statMap: Record<string, number> = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const c of counts) {
      if (statMap[c.status] !== undefined) {
        statMap[c.status] = Number(c.count || 0);
      }
    }

    const todayRows = await sql.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(tokens_used), 0) as tokens
      FROM ai_generation_jobs
      WHERE status = 'completed' AND completed_at >= CURRENT_DATE;
    `);

    return {
      queued: statMap.queued,
      processing: statMap.processing,
      completed: statMap.completed,
      failed: statMap.failed,
      cancelled: statMap.cancelled,
      todayCompleted: Number(todayRows[0]?.count || 0),
      todayTokensUsed: Number(todayRows[0]?.tokens || 0),
    };
  } catch {
    // Resilient fallback to Sanity / local cache
    const jobs = await getAiJobsFromSanity();
    const queued = jobs.filter((j) => j.status === "queued").length;
    const processing = jobs.filter((j) => j.status === "processing").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const cancelled = jobs.filter((j) => j.status === "cancelled").length;

    return {
      queued,
      processing,
      completed,
      failed,
      cancelled,
      todayCompleted: completed,
      todayTokensUsed: completed * 12500,
    };
  }
}

export async function getRecentJobs(limit = 20, statusFilter?: string): Promise<GenerationJobRow[]> {
  try {
    const sql = getDb();
    if (statusFilter && statusFilter !== "all") {
      const rows = await sql.query(
        `SELECT * FROM ai_generation_jobs WHERE status = $1 ORDER BY created_at DESC LIMIT $2;`,
        [statusFilter, limit]
      );
      return rows as GenerationJobRow[];
    }

    const rows = await sql.query(
      `SELECT * FROM ai_generation_jobs ORDER BY created_at DESC LIMIT $1;`,
      [limit]
    );
    return rows as GenerationJobRow[];
  } catch {
    const jobs = await getAiJobsFromSanity();
    let filtered = jobs;
    if (statusFilter && statusFilter !== "all") {
      filtered = jobs.filter((j) => j.status === statusFilter);
    }
    return filtered.slice(0, limit) as any;
  }
}

export async function logExecutionHistory(
  jobId: string,
  eventType: string,
  status: string,
  message: string,
  metadata?: any
) {
  try {
    const sql = getDb();
    await sql.query(
      `INSERT INTO ai_execution_history (job_id, event_type, status, message, metadata)
       VALUES ($1, $2, $3, $4, $5);`,
      [jobId, eventType, status, message, metadata ? JSON.stringify(metadata) : null]
    );
  } catch { }
}
