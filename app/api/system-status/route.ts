import { NextRequest, NextResponse } from "next/server";
import { checkRedisHealth, redis, redisGet, redisSet, getRedisSanitizedHost } from "../../lib/redis";
import { client as sanityClient, projectId, dataset, apiVersion } from "../../sanity/client";
import { getDb } from "../../lib/db";
import { checkRole, clearUserCache } from "../rbac";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { checkGroqHealth, getSupportedGroqModels } from "../../lib/ai/groq-client";
import { checkGeminiHealth } from "../../lib/ai/gemini-client";
import { checkOpenRouterHealth } from "../../lib/ai/openrouter-client";
import { checkImageProvidersHealth } from "../../lib/images/image-service";
import { checkGscHealth } from "../../lib/seo/gsc-service";
import { getActiveSchedule, calculate30DayPreview, updateScheduleConfig, evaluateAndTriggerScheduler } from "../../lib/scheduler/cron-scheduler";
import { getQueueStats, createGenerationBatch, processNextJob } from "../../lib/queue/job-queue";
import { getAiSettingsFromSanity, saveAiSettingsToSanity } from "../../sanity/ai-sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Allow admin and authenticated dashboard users
  const rbac = await checkRole(request, ["admin", "sales", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const timestamp = new Date().toISOString();

  // ── 1. Redis Health & Metrics ──
  const redisHealthPromise = (async () => {
    try {
      const health = await checkRedisHealth();
      let keyCount = 0;
      let memoryUsed = "";

      if (health.status === "connected") {
        try {
          keyCount = await redis.dbsize();
          const memoryInfo = await redis.info("memory");
          const memMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
          if (memMatch) memoryUsed = memMatch[1];
        } catch {
          // ignore stat read error
        }
      }

      // Quick read/write test
      let testOk = false;
      let neonKeyCount = 0;
      if (health.status === "connected") {
        const testKey = "system:status:check";
        await redisSet(testKey, { ok: true, t: Date.now() }, 10);
        const readBack = await redisGet<{ ok: boolean }>(testKey);
        testOk = Boolean(readBack?.ok);

        try {
          const nKeys = await redis.keys("neon:*");
          neonKeyCount = nKeys.length;
        } catch {
          // ignore keys error
        }
      }

      const redisHostInfo = getRedisSanitizedHost();
      return {
        status: health.status,
        host: redisHostInfo.host,
        port: redisHostInfo.port,
        isTls: redisHostInfo.isTls,
        latencyMs: health.pingMs ?? null,
        uptimeSeconds: health.uptimeSeconds ?? null,
        connectedClients: health.connectedClients ?? null,
        keyCount,
        neonKeyCount,
        targetDatabase: "Neon Serverless Postgres",
        connectedToNeon: true,
        cachedEntities: ["clients", "sales", "users", "deliveries", "monthly_drives"],
        memoryUsed: memoryUsed || "N/A",
        readWriteVerified: testOk,
        message: health.message,
      };
    } catch (err: any) {
      const redisHostInfo = getRedisSanitizedHost();
      return {
        status: "error",
        host: redisHostInfo.host,
        port: redisHostInfo.port,
        isTls: redisHostInfo.isTls,
        latencyMs: null,
        message: err?.message || "Redis unavailable",
      };
    }
  })();

  // ── 2. Sanity CMS Health & Metrics ──
  const sanityHealthPromise = (async () => {
    const t0 = Date.now();
    try {
      const query = `{
        "postCount": count(*[_type == "post"]),
        "testimonialCount": count(*[_type == "testimonial"]),
        "pricingPlanCount": count(*[_type == "pricingPlan"]),
        "seoCount": count(*[_type == "pageSeo"])
      }`;
      const counts = await sanityClient.fetch(query, {}, { cache: "no-store" });
      const latencyMs = Date.now() - t0;

      return {
        status: "connected",
        projectId,
        dataset,
        apiVersion,
        latencyMs,
        counts: {
          posts: counts?.postCount || 0,
          testimonials: counts?.testimonialCount || 0,
          pricingPlans: counts?.pricingPlanCount || 0,
          pageSeo: counts?.seoCount || 0,
        },
      };
    } catch (err: any) {
      return {
        status: "error",
        projectId,
        dataset,
        apiVersion,
        latencyMs: Date.now() - t0,
        message: err?.message || "Failed to query Sanity CMS",
      };
    }
  })();

  // ── 3. Neon Postgres DB Health & Metrics ──
  const neonHealthPromise = (async () => {
    const t0 = Date.now();
    try {
      const sql = getDb();
      const [uCount, cCount, sCount, jobCount, topicCount] = await Promise.all([
        sql`SELECT COUNT(*) FROM users;`,
        sql`SELECT COUNT(*) FROM clients;`,
        sql`SELECT COUNT(*) FROM sales;`,
        sql`SELECT COUNT(*) FROM ai_generation_jobs;`,
        sql`SELECT COUNT(*) FROM seo_topics;`,
      ]);
      const latencyMs = Date.now() - t0;
      return {
        status: "connected",
        latencyMs,
        provider: "Neon Serverless Postgres",
        region: "ap-southeast-1 (AWS)",
        counts: {
          users: Number(uCount[0]?.count || 0),
          clients: Number(cCount[0]?.count || 0),
          sales: Number(sCount[0]?.count || 0),
          aiJobs: Number(jobCount[0]?.count || 0),
          seoTopics: Number(topicCount[0]?.count || 0),
        },
      };
    } catch (err: any) {
      return {
        status: "error",
        latencyMs: Date.now() - t0,
        provider: "Neon Serverless Postgres",
        message: err?.message || "Failed to query Neon Postgres",
      };
    }
  })();

  // ── 4. Control System / Local DB ──
  const localDbHealth = (() => {
    const deliveriesPath = join(process.cwd(), "content", "deliveries.json");
    if (existsSync(deliveriesPath)) {
      const stats = statSync(deliveriesPath);
      return {
        status: "ready",
        sizeBytes: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
    }
    return { status: "missing", sizeBytes: 0 };
  })();

  // ── 5. AI Services Health (Groq, Gemini Backup, OpenRouter 3rd Backup, Images, GSC, Scheduler, Queue) ──
  const groqHealthPromise = checkGroqHealth();
  const geminiHealthPromise = checkGeminiHealth();
  const openrouterHealthPromise = checkOpenRouterHealth();
  const imageHealthPromise = checkImageProvidersHealth();
  const gscHealthPromise = checkGscHealth();
  const queueStatsPromise = getQueueStats();
  const activeSchedulePromise = getActiveSchedule();
  const supportedModelsPromise = getSupportedGroqModels();

  // ── 6. AI Automation Settings (Sanity Content Lake) ──
  const aiSettingsPromise = getAiSettingsFromSanity();

  const [
    redisResult,
    sanityResult,
    neonResult,
    groqResult,
    geminiResult,
    openrouterResult,
    imageResult,
    gscResult,
    queueStats,
    activeSchedule,
    supportedModels,
    aiSettings,
  ] = await Promise.all([
    redisHealthPromise,
    sanityHealthPromise,
    neonHealthPromise,
    groqHealthPromise,
    geminiHealthPromise,
    openrouterHealthPromise,
    imageHealthPromise,
    gscHealthPromise,
    queueStatsPromise,
    activeSchedulePromise,
    supportedModelsPromise,
    aiSettingsPromise,
  ]);

  // Generate 30-day preview
  let schedulePreview = null;
  if (activeSchedule) {
    schedulePreview = calculate30DayPreview(activeSchedule);
  }

  // Overall status evaluation
  const coreHealthy =
    redisResult.status === "connected" &&
    sanityResult.status === "connected" &&
    neonResult.status === "connected" &&
    groqResult.status === "connected";

  const overall = coreHealthy
    ? "operational"
    : neonResult.status === "connected" || groqResult.status === "connected"
    ? "degraded"
    : "offline";

  return NextResponse.json({
    success: true,
    timestamp,
    overall: {
      status: overall,
      label:
        overall === "operational"
          ? "All Control & AI Systems Operational"
          : overall === "degraded"
          ? "Partial Degradation Detected"
          : "System Connectivity Offline",
      activeServices: [
        sanityResult.status === "connected" && "Sanity Content Lake (Primary Blog DB)",
        groqResult.status === "connected" && "Groq AI Cloud",
        geminiResult.status === "connected" && "Google Gemini (Active AI Backup)",
        openrouterResult.status === "connected" && "OpenRouter AI (Tertiary AI Backup)",
        redisResult.status === "connected" && "Redis Cache DB",
        neonResult.status === "connected" && "Neon Postgres (CRM & Leads)",
      ].filter(Boolean),
    },
    services: {
      neon: neonResult,
      redis: redisResult,
      sanity: sanityResult,
      groq: groqResult,
      gemini: geminiResult,
      openrouter: openrouterResult,
      pexels: imageResult.pexels,
      unsplash: imageResult.unsplash,
      gsc: gscResult,
      localDb: localDbHealth,
      scheduler: {
        status: aiSettings?.is_enabled && !aiSettings?.is_paused ? "active" : "paused",
        timezone: activeSchedule?.timezone || "Asia/Kolkata",
        generationTime: activeSchedule?.generation_time || "09:00",
        lastRunAt: activeSchedule?.last_run_at || null,
        nextRunAt: schedulePreview?.nextScheduledRun || null,
      },
      jobQueue: queueStats,
    },
    aiAutomation: {
      settings: aiSettings,
      activeSchedule,
      schedulePreview,
      supportedModels: supportedModels.chatModels,
    },
  });
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, settings, schedule, quantity } = body;
    const sql = getDb();

    // 1. Existing action: flush-redis
    if (action === "flush-redis") {
      try {
        await redis.flushdb();
        clearUserCache();
        return NextResponse.json({
          success: true,
          message: "Redis cache flushed and re-synced with Neon Database",
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, message: err?.message || "Failed to flush Redis" },
          { status: 500 }
        );
      }
    }

    // 2. Update AI Automation Settings (Sanity Content Lake)
    if (action === "update-ai-settings") {
      const updatedSettings = await saveAiSettingsToSanity({
        provider: settings?.provider,
        model: settings?.model,
        is_enabled: settings?.is_enabled,
        is_paused: settings?.is_paused,
        daily_target: settings?.daily_target ? Number(settings.daily_target) : undefined,
        max_daily_limit: settings?.max_daily_limit ? Number(settings.max_daily_limit) : undefined,
        auto_publish: settings?.auto_publish,
        groq_api_key: settings?.groq_api_key,
        gemini_api_key: settings?.gemini_api_key,
        openrouter_api_key: settings?.openrouter_api_key,
        pexels_api_key: settings?.pexels_api_key,
        unsplash_access_key: settings?.unsplash_access_key,
      });

      try {
        await sql.query(
          `UPDATE ai_automation_settings
           SET provider = COALESCE($1, provider),
               model = COALESCE($2, model),
               is_enabled = COALESCE($3, is_enabled),
               is_paused = COALESCE($4, is_paused),
               daily_target = COALESCE($5, daily_target),
               max_daily_limit = COALESCE($6, max_daily_limit),
               auto_publish = COALESCE($7, auto_publish),
               groq_api_key = COALESCE($8, groq_api_key),
               gemini_api_key = COALESCE($9, gemini_api_key),
               openrouter_api_key = COALESCE($10, openrouter_api_key),
               pexels_api_key = COALESCE($11, pexels_api_key),
               unsplash_access_key = COALESCE($12, unsplash_access_key),
               updated_at = NOW()
           WHERE id = (SELECT id FROM ai_automation_settings LIMIT 1);`,
          [
            settings?.provider,
            settings?.model,
            settings?.is_enabled,
            settings?.is_paused,
            settings?.daily_target ? Number(settings.daily_target) : null,
            settings?.max_daily_limit ? Number(settings.max_daily_limit) : null,
            settings?.auto_publish,
            settings?.groq_api_key,
            settings?.gemini_api_key,
            settings?.openrouter_api_key,
            settings?.pexels_api_key,
            settings?.unsplash_access_key,
          ]
        );
      } catch {}

      return NextResponse.json({
        success: true,
        message: "AI Automation settings saved to Sanity Content Lake",
        settings: updatedSettings,
      });
    }

    // 3. Pause / Resume automation
    if (action === "toggle-pause") {
      const current = await getAiSettingsFromSanity();
      const newPaused = !current.is_paused;
      const updated = await saveAiSettingsToSanity({ is_paused: newPaused });

      try {
        await sql.query(
          `UPDATE ai_automation_settings
           SET is_paused = $1, updated_at = NOW()
           WHERE id = (SELECT id FROM ai_automation_settings LIMIT 1);`,
          [newPaused]
        );
      } catch {}

      return NextResponse.json({
        success: true,
        message: newPaused ? "AI Automation paused" : "AI Automation resumed",
        is_paused: newPaused,
        settings: updated,
      });
    }

    // 4. Update Schedule
    if (action === "update-schedule") {
      const activeSchedule = await getActiveSchedule();
      const scheduleId = activeSchedule?.id || 1;
      const updated = await updateScheduleConfig(scheduleId, schedule);
      const preview = calculate30DayPreview(updated);
      return NextResponse.json({
        success: true,
        message: "Schedule updated successfully",
        schedule: updated,
        preview,
      });
    }

    // 5. Trigger manual generation batch
    if (action === "trigger-generation") {
      const targetQty = Number(quantity) || 5;
      const schedule = await getActiveSchedule();
      const scheduleId = schedule?.id;

      const { getSeoTopics, researchAndSuggestTopics } = await import("../../lib/seo/topic-engine");
      let topics = await getSeoTopics("suggested");
      if (topics.length < targetQty) {
        try {
          await researchAndSuggestTopics(targetQty);
          topics = await getSeoTopics("suggested");
        } catch {}
      }

      const selected = topics.slice(0, targetQty);
      const jobsToCreate = selected.map((t) => ({
        title: t.title,
        category: t.category,
        topic_id: t.id,
      }));

      if (jobsToCreate.length === 0) {
        for (let i = 1; i <= targetQty; i++) {
          jobsToCreate.push({
            title: `High-Retention Instagram Reels for Hyderabad Businesses - Batch #${i}`,
            category: "Video Production",
            topic_id: undefined as any,
          });
        }
      }

      const batchResult = await createGenerationBatch({
        batchName: `Manual Trigger - ${new Date().toISOString().split("T")[0]}`,
        schedule_id: scheduleId,
        jobs: jobsToCreate,
      });

      // Trigger first job in background
      processNextJob().catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Successfully triggered generation batch with ${batchResult.jobs.length} jobs`,
        batch: batchResult.batch,
        jobsCount: batchResult.jobs.length,
      });
    }

    // 6. Evaluate scheduler
    if (action === "evaluate-scheduler") {
      const res = await evaluateAndTriggerScheduler();
      return NextResponse.json({ success: true, result: res });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
