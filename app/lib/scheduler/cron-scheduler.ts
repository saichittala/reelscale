import { getDb } from "../db";
import { createGenerationBatch, processNextJob } from "../queue/job-queue";
import { getSeoTopics, researchAndSuggestTopics } from "../seo/topic-engine";
import { getAiScheduleFromSanity, saveAiScheduleToSanity } from "../../sanity/ai-sync";

export interface ScheduleConfig {
  id: number;
  name: string;
  schedule_type:
  | "daily"
  | "selected_weekdays"
  | "alternate_days"
  | "every_n_days"
  | "weekly_custom"
  | "custom_dates"
  | "one_time";
  is_active: boolean;
  start_date: string;
  end_date?: string | null;
  generation_time: string; // HH:mm format, e.g. "09:00"
  timezone: string; // default "Asia/Kolkata"
  blogs_per_execution: number;
  blogs_per_active_day: number;
  max_generation_quantity: number;
  active_weekdays: string[]; // ["monday", "tuesday", ...]
  interval_days: number;
  weekday_quantities: Record<string, number>; // { monday: 10, tuesday: 5, ... }
  custom_dates: { date: string; count: number }[];
  catch_up_missed: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarDayPreview {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  isActive: boolean;
  quantity: number;
  estimatedTokens: number;
  reason: string;
}

export interface Schedule30DayPreview {
  activeDaysCount: number;
  skippedDaysCount: number;
  nextScheduledRun: string | null;
  expectedWeeklyTotal: number;
  expectedMonthlyTotal: number;
  estimatedTotalTokens: number;
  days: CalendarDayPreview[];
}

export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export async function getActiveSchedule(): Promise<ScheduleConfig | null> {
  // 1. Check Sanity CMS Content Lake as primary blog schedule database
  try {
    const sanitySched = await getAiScheduleFromSanity();
    if (sanitySched) {
      return {
        id: 1,
        name: "Sanity Primary Blog Schedule",
        schedule_type: (sanitySched.schedule_type as any) || "selected_weekdays",
        is_active: sanitySched.is_active !== undefined ? sanitySched.is_active : true,
        start_date: new Date().toISOString().split("T")[0],
        generation_time: sanitySched.generation_time || "09:00",
        timezone: sanitySched.timezone || "Asia/Kolkata",
        blogs_per_execution: (sanitySched.blogs_per_execution !== undefined && sanitySched.blogs_per_execution !== null) ? Number(sanitySched.blogs_per_execution) : 10,
        blogs_per_active_day: (sanitySched.blogs_per_active_day !== undefined && sanitySched.blogs_per_active_day !== null) ? Number(sanitySched.blogs_per_active_day) : 10,
        max_generation_quantity: (sanitySched.max_generation_qty !== undefined && sanitySched.max_generation_qty !== null) ? Number(sanitySched.max_generation_qty) : 50,
        active_weekdays: sanitySched.active_weekdays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        interval_days: sanitySched.interval_days || 2,
        weekday_quantities: sanitySched.weekly_quantities || {
          monday: 10,
          tuesday: 10,
          wednesday: 10,
          thursday: 10,
          friday: 10,
          saturday: 0,
          sunday: 0,
        },
        custom_dates: Array.isArray(sanitySched.custom_dates)
          ? sanitySched.custom_dates.map((cd: any) => ({
            date: cd.date,
            count: Number(cd.count ?? cd.quantity ?? 10),
          }))
          : [],
        catch_up_missed: !sanitySched.skip_missed_runs,
        last_run_at: sanitySched.last_run_at || null,
        next_run_at: sanitySched.next_run_at || null,
        created_at: new Date().toISOString(),
        updated_at: sanitySched.updated_at || new Date().toISOString(),
      };
    }
  } catch (err: any) {
    console.warn("[Scheduler] Sanity schedule fetch failed, attempting DB:", err?.message);
  }

  // 2. Secondary fallback to DB if linked
  try {
    const sql = getDb();
    const rows = await sql.query(
      `SELECT * FROM ai_schedule_configs WHERE is_active = TRUE ORDER BY id ASC LIMIT 1;`
    );
    if (rows.length > 0) return normalizeScheduleRow(rows[0]);
  } catch {
    // Non-blocking fallback
  }

  return null;
}

export async function getAllSchedules(): Promise<ScheduleConfig[]> {
  const active = await getActiveSchedule();
  return active ? [active] : [];
}

function normalizeScheduleRow(row: any): ScheduleConfig {
  return {
    ...row,
    active_weekdays: Array.isArray(row.active_weekdays)
      ? row.active_weekdays
      : typeof row.active_weekdays === "string"
        ? JSON.parse(row.active_weekdays)
        : ["monday", "tuesday", "wednesday", "thursday", "friday"],
    weekday_quantities:
      typeof row.weekday_quantities === "object" && row.weekday_quantities !== null
        ? row.weekday_quantities
        : typeof row.weekday_quantities === "string"
          ? JSON.parse(row.weekday_quantities)
          : { monday: 10, tuesday: 10, wednesday: 10, thursday: 10, friday: 10, saturday: 0, sunday: 0 },
    custom_dates: Array.isArray(row.custom_dates)
      ? row.custom_dates
      : typeof row.custom_dates === "string"
        ? JSON.parse(row.custom_dates)
        : [],
  };
}

export async function updateScheduleConfig(
  id: number,
  data: Partial<ScheduleConfig>
): Promise<ScheduleConfig> {
  // 1. Primary persistence to Sanity CMS Content Lake
  await saveAiScheduleToSanity({
    schedule_type: data.schedule_type,
    is_active: data.is_active,
    generation_time: data.generation_time,
    timezone: data.timezone,
    blogs_per_execution: data.blogs_per_execution,
    blogs_per_active_day: data.blogs_per_active_day,
    max_generation_qty: data.max_generation_quantity,
    active_weekdays: data.active_weekdays,
    interval_days: data.interval_days,
    weekly_quantities: data.weekday_quantities,
    custom_dates: data.custom_dates
      ? data.custom_dates.map((cd) => ({
        date: cd.date,
        count: cd.count,
        quantity: cd.count,
      }))
      : undefined,
    skip_missed_runs: data.catch_up_missed !== undefined ? !data.catch_up_missed : undefined,
  });

  // 2. Optional sync to Neon if configured
  try {
    const sql = getDb();
    const rows = await sql.query(
      `UPDATE ai_schedule_configs
       SET name = COALESCE($1, name),
           schedule_type = COALESCE($2, schedule_type),
           is_active = COALESCE($3, is_active),
           start_date = COALESCE($4, start_date),
           end_date = $5,
           generation_time = COALESCE($6, generation_time),
           timezone = COALESCE($7, timezone),
           blogs_per_execution = COALESCE($8, blogs_per_execution),
           blogs_per_active_day = COALESCE($9, blogs_per_active_day),
           max_generation_quantity = COALESCE($10, max_generation_quantity),
           active_weekdays = COALESCE($11, active_weekdays),
           interval_days = COALESCE($12, interval_days),
           weekday_quantities = COALESCE($13, weekday_quantities),
           custom_dates = COALESCE($14, custom_dates),
           catch_up_missed = COALESCE($15, catch_up_missed),
           updated_at = NOW()
       WHERE id = $16
       RETURNING *;`,
      [
        data.name,
        data.schedule_type,
        data.is_active,
        data.start_date,
        data.end_date ?? null,
        data.generation_time,
        data.timezone,
        data.blogs_per_execution,
        data.blogs_per_active_day,
        data.max_generation_quantity,
        data.active_weekdays ? JSON.stringify(data.active_weekdays) : null,
        data.interval_days,
        data.weekday_quantities ? JSON.stringify(data.weekday_quantities) : null,
        data.custom_dates ? JSON.stringify(data.custom_dates) : null,
        data.catch_up_missed,
        id,
      ]
    );
    if (rows.length > 0) return normalizeScheduleRow(rows[0]);
  } catch {
    // Non-blocking fallback if SQL is unavailable
  }

  const active = await getActiveSchedule();
  if (active) return active;

  throw new Error(`Schedule #${id} not found`);
}

/**
 * Calculates a complete 30-day forward calendar preview based on schedule parameters.
 * Recalculates immediately when configuration changes.
 */
export function calculate30DayPreview(
  schedule: ScheduleConfig,
  referenceDate = new Date()
): Schedule30DayPreview {
  const days: CalendarDayPreview[] = [];
  const TOKENS_PER_BLOG_ESTIMATE = 12500;

  const startDate = new Date(schedule.start_date || referenceDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = schedule.end_date ? new Date(schedule.end_date) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  let nextScheduledRun: string | null = null;
  let expectedWeeklyTotal = 0;
  let expectedMonthlyTotal = 0;

  for (let i = 0; i < 30; i++) {
    const current = new Date(referenceDate);
    current.setDate(current.getDate() + i);
    current.setHours(0, 0, 0, 0);

    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeekIndex = current.getDay();
    const dayName = WEEKDAYS[dayOfWeekIndex];
    const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    let isActive = false;
    let quantity = 0;
    let reason = "";

    // Check boundary
    if (current < startDate) {
      isActive = false;
      reason = "Before schedule start date";
    } else if (endDate && current > endDate) {
      isActive = false;
      reason = "After schedule end date";
    } else if (!schedule.is_active) {
      isActive = false;
      reason = "Automation schedule paused";
    } else {
      const diffMs = current.getTime() - startDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      switch (schedule.schedule_type) {
        case "daily":
          isActive = true;
          quantity = schedule.blogs_per_active_day;
          reason = `Daily generation: ${quantity} blogs`;
          break;

        case "selected_weekdays":
          if (schedule.active_weekdays.includes(dayName)) {
            isActive = true;
            quantity = schedule.blogs_per_active_day;
            reason = `Active weekday (${formattedDayName}): ${quantity} blogs`;
          } else {
            reason = `Skipped weekday (${formattedDayName})`;
          }
          break;

        case "alternate_days":
          if (diffDays % 2 === 0) {
            isActive = true;
            quantity = schedule.blogs_per_active_day;
            reason = `Alternate active day (${diffDays} days from start)`;
          } else {
            reason = "Alternate skip day";
          }
          break;

        case "every_n_days":
          const interval = Math.max(1, schedule.interval_days || 2);
          if (diffDays % interval === 0) {
            isActive = true;
            quantity = schedule.blogs_per_active_day;
            reason = `Every ${interval} days schedule: ${quantity} blogs`;
          } else {
            reason = `Skip day (interval ${interval})`;
          }
          break;

        case "weekly_custom":
          const customQty = schedule.weekday_quantities?.[dayName] ?? 0;
          if (customQty > 0) {
            isActive = true;
            quantity = customQty;
            reason = `Custom ${formattedDayName} allocation: ${quantity} blogs`;
          } else {
            reason = `No blogs allocated for ${formattedDayName}`;
          }
          break;

        case "custom_dates":
          const matchedCustom = schedule.custom_dates?.find((cd) => cd.date === dateStr);
          if (matchedCustom && matchedCustom.count > 0) {
            isActive = true;
            quantity = matchedCustom.count;
            reason = `Custom scheduled date: ${quantity} blogs`;
          } else {
            reason = "Not a designated custom run date";
          }
          break;

        case "one_time":
          if (i === 0 || dateStr === schedule.start_date) {
            isActive = true;
            quantity = schedule.blogs_per_active_day;
            reason = `One-time batch execution: ${quantity} blogs`;
          } else {
            reason = "One-time run concluded";
          }
          break;
      }
    }

    // Cap at max_generation_quantity
    if (quantity > schedule.max_generation_quantity) {
      quantity = schedule.max_generation_quantity;
    }

    const estimatedTokens = quantity * TOKENS_PER_BLOG_ESTIMATE;

    if (isActive && !nextScheduledRun) {
      nextScheduledRun = `${dateStr} at ${schedule.generation_time} (${schedule.timezone})`;
    }

    if (i < 7) {
      expectedWeeklyTotal += quantity;
    }
    expectedMonthlyTotal += quantity;

    days.push({
      date: dateStr,
      dayOfWeek: formattedDayName,
      isActive,
      quantity,
      estimatedTokens,
      reason,
    });
  }

  const activeDaysCount = days.filter((d) => d.isActive).length;
  const skippedDaysCount = days.length - activeDaysCount;
  const estimatedTotalTokens = expectedMonthlyTotal * TOKENS_PER_BLOG_ESTIMATE;

  return {
    activeDaysCount,
    skippedDaysCount,
    nextScheduledRun,
    expectedWeeklyTotal,
    expectedMonthlyTotal,
    estimatedTotalTokens,
    days,
  };
}

/**
 * Triggers scheduled evaluation and execution if current time matches scheduled window
 */
export async function evaluateAndTriggerScheduler(): Promise<{
  triggered: boolean;
  message: string;
  batchId?: string;
  jobsCount?: number;
}> {
  const sql = getDb();

  // 1. Check Sanity CMS AI automation settings
  try {
    const { getAiSettingsFromSanity } = await import("../../sanity/ai-sync");
    const sanitySettings = await getAiSettingsFromSanity();
    if (sanitySettings) {
      if (!sanitySettings.is_enabled) {
        return { triggered: false, message: "AI Automation is disabled globally" };
      }
      if (sanitySettings.is_paused) {
        return { triggered: false, message: "AI Automation is currently paused" };
      }
    }
  } catch {}

  // 2. Check SQL general automation settings
  try {
    const settingsRows = await sql.query(`SELECT is_enabled, is_paused FROM ai_automation_settings LIMIT 1;`);
    if (settingsRows.length > 0) {
      if (!settingsRows[0].is_enabled) {
        return { triggered: false, message: "AI Automation is disabled globally" };
      }
      if (settingsRows[0].is_paused) {
        return { triggered: false, message: "AI Automation is currently paused" };
      }
    }
  } catch {}

  const schedule = await getActiveSchedule();
  if (!schedule || !schedule.is_active) {
    return { triggered: false, message: "AI Automation schedule is currently paused or inactive" };
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Check if today is active
  const preview = calculate30DayPreview(schedule, now);
  const todayPreview = preview.days[0];

  if (!todayPreview || !todayPreview.isActive || todayPreview.quantity <= 0) {
    return {
      triggered: false,
      message: `Today (${todayStr}) is not an active generation day: ${todayPreview?.reason || "Skipped"}`,
    };
  }

  // Prevent duplicate run on the same day
  if (schedule.last_run_at) {
    const lastRunDateStr = new Date(schedule.last_run_at).toISOString().split("T")[0];
    if (lastRunDateStr === todayStr) {
      return { triggered: false, message: `Batch for today (${todayStr}) has already been scheduled` };
    }
  }

  // Find or generate topics for the batch
  let availableTopics = await getSeoTopics("suggested");
  if (availableTopics.length < todayPreview.quantity) {
    try {
      const needed = todayPreview.quantity - availableTopics.length;
      await researchAndSuggestTopics(Math.max(needed, 5));
      availableTopics = await getSeoTopics("suggested");
    } catch (err: any) {
      console.warn("Topic auto-research warning:", err.message);
    }
  }

  const selectedTopics = availableTopics.slice(0, todayPreview.quantity);
  const jobsToCreate = selectedTopics.map((t) => ({
    title: t.title,
    category: t.category,
    topic_id: t.id,
  }));

  // Fallback default jobs if topics empty
  if (jobsToCreate.length === 0) {
    for (let i = 1; i <= todayPreview.quantity; i++) {
      jobsToCreate.push({
        title: `Short-Form Instagram Reels Production Strategy in Hyderabad - Edition ${i}`,
        category: "Video Production",
        topic_id: undefined as any,
      });
    }
  }

  const { batch, jobs } = await createGenerationBatch({
    batchName: `${schedule.name} - ${todayStr}`,
    schedule_id: schedule.id,
    jobs: jobsToCreate,
  });

  // Update schedule last_run_at and next_run_at
  await sql.query(
    `UPDATE ai_schedule_configs
     SET last_run_at = NOW(),
         next_run_at = NOW() + INTERVAL '1 day',
         updated_at = NOW()
     WHERE id = $1;`,
    [schedule.id]
  );

  // Trigger processing of the first job asynchronously
  processNextJob().catch(() => { });

  return {
    triggered: true,
    message: `Scheduled batch '${batch.batch_name}' with ${jobs.length} jobs`,
    batchId: batch.id,
    jobsCount: jobs.length,
  };
}
