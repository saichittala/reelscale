import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  getActiveSchedule,
  getAllSchedules,
  updateScheduleConfig,
  calculate30DayPreview,
  evaluateAndTriggerScheduler,
} from "../../../lib/scheduler/cron-scheduler";
import { getDb } from "../../../lib/db";
import { saveAiSettingsToSanity } from "../../../sanity/ai-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const activeSchedule = await getActiveSchedule();
    const allSchedules = await getAllSchedules();

    const { searchParams } = new URL(request.url);
    if (searchParams.get("preview") === "30days") {
      const scheduleType = searchParams.get("schedule_type") || activeSchedule?.schedule_type || "daily";
      const blogsPerActiveDay = searchParams.get("blogs_per_active_day")
        ? Number(searchParams.get("blogs_per_active_day"))
        : (activeSchedule?.blogs_per_active_day ?? 1);
      const maxDailyLimit = searchParams.get("max_daily_limit")
        ? Number(searchParams.get("max_daily_limit"))
        : (activeSchedule?.max_generation_quantity ?? 50);
      const activeWeekdays = searchParams.get("active_weekdays")
        ? searchParams.get("active_weekdays")!.split(",")
        : (activeSchedule?.active_weekdays || ["monday", "tuesday", "wednesday", "thursday", "friday"]);
      const intervalDays = searchParams.get("interval_days")
        ? Number(searchParams.get("interval_days"))
        : (activeSchedule?.interval_days ?? 2);
      let weekdayQuantities = activeSchedule?.weekday_quantities || {};
      try {
        if (searchParams.get("weekday_quantities")) {
          weekdayQuantities = JSON.parse(searchParams.get("weekday_quantities")!);
        }
      } catch {}

      const merged = {
        ...(activeSchedule || {}),
        schedule_type: scheduleType as any,
        blogs_per_active_day: blogsPerActiveDay,
        max_generation_quantity: maxDailyLimit,
        active_weekdays: activeWeekdays,
        interval_days: intervalDays,
        weekday_quantities: weekdayQuantities,
      };
      const dynamicPreview = calculate30DayPreview(merged as any);
      return NextResponse.json({ success: true, preview: dynamicPreview });
    }

    let preview = null;
    if (activeSchedule) {
      preview = calculate30DayPreview(activeSchedule);
    }

    return NextResponse.json({
      success: true,
      schedule: activeSchedule,
      activeSchedule,
      allSchedules,
      preview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load schedule" },
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
    const { action, scheduleId, config, ...data } = body;

    switch (action) {
      case "update":
      case "update_schedule": {
        const id = Number(scheduleId || config?.id || 1);
        const inputData = config || data;

        const blogsPerActiveDay = inputData.blogs_per_active_day !== undefined
          ? Number(inputData.blogs_per_active_day)
          : undefined;

        const maxQty = inputData.max_daily_generation_limit !== undefined
          ? Number(inputData.max_daily_generation_limit)
          : inputData.max_generation_quantity !== undefined
          ? Number(inputData.max_generation_quantity)
          : undefined;

        const intervalDays = inputData.interval_days !== undefined
          ? Number(inputData.interval_days)
          : undefined;

        const schedulePayload: any = {
          ...inputData,
        };
        if (blogsPerActiveDay !== undefined) schedulePayload.blogs_per_active_day = blogsPerActiveDay;
        if (maxQty !== undefined) schedulePayload.max_generation_quantity = maxQty;
        if (intervalDays !== undefined) schedulePayload.interval_days = intervalDays;
        if (inputData.is_active !== undefined) schedulePayload.is_active = Boolean(inputData.is_active);

        const updated = await updateScheduleConfig(id, schedulePayload);

        // Also sync AI settings (auto_publish, model, is_paused) if provided
        const settingsUpdate: any = {};
        if (inputData.auto_publish_to_sanity !== undefined) {
          settingsUpdate.auto_publish = Boolean(inputData.auto_publish_to_sanity);
        } else if (inputData.auto_publish !== undefined) {
          settingsUpdate.auto_publish = Boolean(inputData.auto_publish);
        }
        if (inputData.groq_model) settingsUpdate.model = inputData.groq_model;
        if (blogsPerActiveDay !== undefined) settingsUpdate.daily_target = blogsPerActiveDay;
        if (maxQty !== undefined) settingsUpdate.max_daily_limit = maxQty;
        if (inputData.is_active !== undefined) settingsUpdate.is_paused = !Boolean(inputData.is_active);

        if (Object.keys(settingsUpdate).length > 0) {
          await saveAiSettingsToSanity(settingsUpdate).catch(() => {});
        }

        const preview = calculate30DayPreview(updated);
        return NextResponse.json({
          success: true,
          message: "Schedule configuration saved successfully",
          schedule: updated,
          activeSchedule: updated,
          preview,
        });
      }

      case "toggle_active":
      case "toggle-active":
      case "toggle-pause": {
        const activeSchedule = await getActiveSchedule();
        const nextActive = data.is_active !== undefined
          ? Boolean(data.is_active)
          : activeSchedule ? !activeSchedule.is_active : false;

        const id = Number(scheduleId || config?.id || activeSchedule?.id || 1);
        const updated = await updateScheduleConfig(id, { is_active: nextActive });

        // Sync to Sanity and PostgreSQL AI automation settings
        await saveAiSettingsToSanity({ is_paused: !nextActive }).catch(() => {});
        try {
          const sql = getDb();
          await sql.query(
            `UPDATE ai_automation_settings SET is_paused = $1, updated_at = NOW() WHERE id = (SELECT id FROM ai_automation_settings LIMIT 1);`,
            [!nextActive]
          );
        } catch {}

        const preview = calculate30DayPreview(updated);
        return NextResponse.json({
          success: true,
          message: nextActive ? "AI Automation resumed successfully!" : "AI Automation paused.",
          is_active: nextActive,
          is_paused: !nextActive,
          schedule: updated,
          activeSchedule: updated,
          preview,
        });
      }

      case "preview": {
        // Dynamic preview without saving to DB (for instant UI preview when user is tweaking sliders)
        const activeSchedule = await getActiveSchedule();
        const merged = { ...(activeSchedule || {}), ...(config || data) } as any;
        const preview = calculate30DayPreview(merged);
        return NextResponse.json({ success: true, preview });
      }

      case "batch-schedule":
      case "trigger-manual-batch": {
        const targetQuantity = Number(data.quantity || data.count) || 5;
        const category = data.category || "Video Production";

        // Create on-demand batch
        const sql = getDb();
        const schedule = await getActiveSchedule();
        const activeId = schedule?.id || null;

        const { createGenerationBatch, processNextJob } = await import("../../../lib/queue/job-queue");
        const { getSeoTopics, researchAndSuggestTopics } = await import("../../../lib/seo/topic-engine");

        let topics = await getSeoTopics("suggested");
        if (topics.length < targetQuantity) {
          try {
            await researchAndSuggestTopics(targetQuantity);
            topics = await getSeoTopics("suggested");
          } catch {}
        }

        const selected = topics.slice(0, targetQuantity);
        const jobs = selected.map((t) => ({
          title: t.title,
          category: t.category,
          topic_id: t.id,
        }));

        if (jobs.length === 0) {
          for (let i = 1; i <= targetQuantity; i++) {
            jobs.push({
              title: `High-Performance Instagram Reels for Hyderabad Businesses - Batch #${i}`,
              category,
              topic_id: undefined as any,
            });
          }
        }

        const batchResult = await createGenerationBatch({
          batchName: `Manual Batch - ${new Date().toISOString().split("T")[0]}`,
          schedule_id: activeId || undefined,
          jobs,
        });

        // Trigger worker asynchronously with force: true since it's a manual action
        processNextJob({ force: true }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: `Manually triggered batch with ${batchResult.jobs.length} generation jobs`,
          batch: batchResult.batch,
          jobsCount: batchResult.jobs.length,
        });
      }

      case "evaluate-schedule": {
        const result = await evaluateAndTriggerScheduler();
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unknown action '${action}'` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process schedule action" },
      { status: 500 }
    );
  }
}
