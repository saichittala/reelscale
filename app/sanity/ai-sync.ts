import { writeClient, client } from './client';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Local storage paths as resilient caching fallbacks
const CONTENT_DIR = join(process.cwd(), 'content');
const SETTINGS_PATH = join(CONTENT_DIR, 'ai-settings.json');
const SCHEDULE_PATH = join(CONTENT_DIR, 'ai-schedule.json');
const TOPICS_PATH = join(CONTENT_DIR, 'ai-topics.json');
const JOBS_PATH = join(CONTENT_DIR, 'ai-jobs.json');

export interface SanityAiSettings {
  _id?: string;
  _type?: string;
  provider: string;
  model: string;
  is_enabled: boolean;
  is_paused: boolean;
  daily_target: number;
  max_daily_limit: number;
  auto_publish: boolean;
  groq_api_key?: string;
  gemini_api_key?: string;
  openrouter_api_key?: string;
  pexels_api_key?: string;
  unsplash_access_key?: string;
  pixabay_api_key?: string;
  updated_at?: string;
}

export interface SanityAiSchedule {
  _id?: string;
  _type?: string;
  schedule_type: string;
  blogs_per_active_day: number;
  blogs_per_execution: number;
  max_generation_qty: number;
  generation_time: string;
  timezone: string;
  active_weekdays: string[];
  interval_days: number;
  weekly_quantities: Record<string, number>;
  custom_dates: Array<{ date: string; count?: number; quantity?: number }>;
  is_active: boolean;
  skip_missed_runs: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  updated_at?: string;
}

export interface SanitySeoTopic {
  _id?: string;
  _type?: string;
  id?: number | string;
  title: string;
  slug: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  search_intent?: string;
  target_audience?: string;
  category: string;
  business_relevance?: string;
  content_priority?: string;
  status: 'suggested' | 'approved' | 'queued' | 'generating' | 'published' | 'rejected';
  reason_for_creation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SanityAiJob {
  _id?: string;
  _type?: string;
  id: string;
  batch_id?: string | null;
  topic_id?: number | string | null;
  title: string;
  slug: string;
  category: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  stage: string;
  attempts: number;
  max_retries: number;
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

const DEFAULT_SETTINGS: SanityAiSettings = {
  provider: 'groq',
  model: 'openai/gpt-oss-120b',
  is_enabled: true,
  is_paused: false,
  daily_target: 10,
  max_daily_limit: 50,
  auto_publish: false,
  updated_at: new Date().toISOString(),
};

const DEFAULT_SCHEDULE: SanityAiSchedule = {
  schedule_type: 'selected_weekdays',
  blogs_per_active_day: 10,
  blogs_per_execution: 10,
  max_generation_qty: 50,
  generation_time: '09:00',
  timezone: 'Asia/Kolkata',
  active_weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  interval_days: 2,
  weekly_quantities: {
    monday: 10,
    tuesday: 10,
    wednesday: 10,
    thursday: 10,
    friday: 10,
    saturday: 0,
    sunday: 0,
  },
  custom_dates: [],
  is_active: true,
  skip_missed_runs: true,
  last_run_at: null,
  next_run_at: null,
  updated_at: new Date().toISOString(),
};

// ─── 1. AI SETTINGS SYNC ───

export async function getAiSettingsFromSanity(): Promise<SanityAiSettings> {
  try {
    const doc = await client.fetch(`*[_type == "aiSettings" && _id == "ai-automation-settings"][0]`);
    if (doc) {
      return {
        provider: doc.provider || DEFAULT_SETTINGS.provider,
        model: doc.model || DEFAULT_SETTINGS.model,
        is_enabled: doc.is_enabled !== undefined ? doc.is_enabled : DEFAULT_SETTINGS.is_enabled,
        is_paused: doc.is_paused !== undefined ? doc.is_paused : DEFAULT_SETTINGS.is_paused,
        daily_target: doc.daily_target || DEFAULT_SETTINGS.daily_target,
        max_daily_limit: doc.max_daily_limit || DEFAULT_SETTINGS.max_daily_limit,
        auto_publish: Boolean(doc.auto_publish),
        groq_api_key: doc.groq_api_key,
        gemini_api_key: doc.gemini_api_key,
        openrouter_api_key: doc.openrouter_api_key,
        pexels_api_key: doc.pexels_api_key,
        unsplash_access_key: doc.unsplash_access_key,
        pixabay_api_key: doc.pixabay_api_key,
        updated_at: doc.updated_at,
      };
    }
  } catch (err: any) {
    console.warn('[Sanity AI Sync] Failed to fetch settings from Sanity:', err.message);
  }

  if (existsSync(SETTINGS_PATH)) {
    try {
      return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
    } catch {}
  }

  return DEFAULT_SETTINGS;
}

export async function saveAiSettingsToSanity(settings: Partial<SanityAiSettings>): Promise<SanityAiSettings> {
  const current = await getAiSettingsFromSanity();
  const merged: SanityAiSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const doc = {
    _id: 'ai-automation-settings',
    _type: 'aiSettings',
    ...merged,
  };

  try {
    await writeClient.createOrReplace(doc);
    console.log('[Sanity AI Sync] AI settings saved to Sanity Content Lake.');
  } catch (err: any) {
    console.error('[Sanity AI Sync] Error saving settings to Sanity:', err.message);
  }

  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch {}

  return merged;
}

// ─── 2. AI SCHEDULE SYNC ───

export async function getAiScheduleFromSanity(): Promise<SanityAiSchedule> {
  try {
    const doc = await client.fetch(`*[_type == "aiSchedule" && _id == "ai-active-schedule"][0]`);
    if (doc) {
      return {
        schedule_type: doc.schedule_type || DEFAULT_SCHEDULE.schedule_type,
        blogs_per_active_day: doc.blogs_per_active_day || DEFAULT_SCHEDULE.blogs_per_active_day,
        blogs_per_execution: doc.blogs_per_execution || DEFAULT_SCHEDULE.blogs_per_execution,
        max_generation_qty: doc.max_generation_qty || DEFAULT_SCHEDULE.max_generation_qty,
        generation_time: doc.generation_time || DEFAULT_SCHEDULE.generation_time,
        timezone: doc.timezone || DEFAULT_SCHEDULE.timezone,
        active_weekdays: Array.isArray(doc.active_weekdays) ? doc.active_weekdays : DEFAULT_SCHEDULE.active_weekdays,
        interval_days: doc.interval_days || DEFAULT_SCHEDULE.interval_days,
        weekly_quantities: doc.weekly_quantities || DEFAULT_SCHEDULE.weekly_quantities,
        custom_dates: Array.isArray(doc.custom_dates) ? doc.custom_dates : [],
        is_active: doc.is_active !== undefined ? doc.is_active : DEFAULT_SCHEDULE.is_active,
        skip_missed_runs: doc.skip_missed_runs !== undefined ? doc.skip_missed_runs : DEFAULT_SCHEDULE.skip_missed_runs,
        last_run_at: doc.last_run_at || null,
        next_run_at: doc.next_run_at || null,
        updated_at: doc.updated_at,
      };
    }
  } catch (err: any) {
    console.warn('[Sanity AI Sync] Failed to fetch schedule from Sanity:', err.message);
  }

  if (existsSync(SCHEDULE_PATH)) {
    try {
      return JSON.parse(readFileSync(SCHEDULE_PATH, 'utf8'));
    } catch {}
  }

  return DEFAULT_SCHEDULE;
}

export async function saveAiScheduleToSanity(schedule: Partial<SanityAiSchedule>): Promise<SanityAiSchedule> {
  const current = await getAiScheduleFromSanity();
  const merged: SanityAiSchedule = {
    ...current,
    ...schedule,
    updated_at: new Date().toISOString(),
  };

  const doc = {
    _id: 'ai-active-schedule',
    _type: 'aiSchedule',
    ...merged,
  };

  try {
    await writeClient.createOrReplace(doc);
    console.log('[Sanity AI Sync] AI Schedule saved to Sanity Content Lake.');
  } catch (err: any) {
    console.error('[Sanity AI Sync] Error saving schedule to Sanity:', err.message);
  }

  try {
    writeFileSync(SCHEDULE_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch {}

  return merged;
}

// ─── 3. SEO TOPICS SYNC ───

export async function getSeoTopicsFromSanity(): Promise<SanitySeoTopic[]> {
  try {
    const docs = await client.fetch(`*[_type == "seoTopic"] | order(_createdAt desc)`);
    if (Array.isArray(docs) && docs.length > 0) {
      return docs.map((d: any) => ({
        id: d._id.replace(/^seo-topic-/, ''),
        title: d.title,
        slug: d.slug,
        primary_keyword: d.primary_keyword,
        secondary_keywords: d.secondary_keywords || [],
        search_intent: d.search_intent || 'Commercial',
        target_audience: d.target_audience || 'Hyderabad Business Owners',
        category: d.category || 'Video Production',
        business_relevance: d.business_relevance || '',
        content_priority: d.content_priority || 'High',
        status: d.status || 'suggested',
        reason_for_creation: d.reason_for_creation || '',
        created_at: d._createdAt,
        updated_at: d._updatedAt,
      }));
    }
  } catch (err: any) {
    console.warn('[Sanity AI Sync] Failed to fetch SEO topics from Sanity:', err.message);
  }

  if (existsSync(TOPICS_PATH)) {
    try {
      return JSON.parse(readFileSync(TOPICS_PATH, 'utf8'));
    } catch {}
  }

  return [];
}

export async function saveSeoTopicToSanity(topic: SanitySeoTopic): Promise<SanitySeoTopic> {
  const docId = `seo-topic-${topic.slug || Date.now()}`;
  const doc = {
    _id: docId,
    _type: 'seoTopic',
    ...topic,
    updated_at: new Date().toISOString(),
  };

  try {
    await writeClient.createOrReplace(doc);
  } catch (err: any) {
    console.warn('[Sanity AI Sync] Error saving SEO topic to Sanity:', err.message);
  }

  // Update local cache
  try {
    const current = existsSync(TOPICS_PATH) ? JSON.parse(readFileSync(TOPICS_PATH, 'utf8')) : [];
    const idx = current.findIndex((t: any) => t.slug === topic.slug || t.id === topic.id);
    if (idx >= 0) current[idx] = topic;
    else current.unshift(topic);
    writeFileSync(TOPICS_PATH, JSON.stringify(current, null, 2), 'utf8');
  } catch {}

  return topic;
}

// ─── 4. AI JOBS SYNC ───

export async function getAiJobsFromSanity(): Promise<SanityAiJob[]> {
  try {
    const docs = await client.fetch(`*[_type == "aiJob"] | order(created_at desc) [0...50]`);
    if (Array.isArray(docs) && docs.length > 0) {
      return docs as SanityAiJob[];
    }
  } catch (err: any) {
    console.warn('[Sanity AI Sync] Failed to fetch AI jobs from Sanity:', err.message);
  }

  if (existsSync(JOBS_PATH)) {
    try {
      return JSON.parse(readFileSync(JOBS_PATH, 'utf8'));
    } catch {}
  }

  return [];
}

export async function saveAiJobToSanity(job: SanityAiJob): Promise<SanityAiJob> {
  const docId = `ai-job-${job.id}`;
  const doc = {
    _id: docId,
    _type: 'aiJob',
    ...job,
    updated_at: new Date().toISOString(),
  };

  try {
    await writeClient.createOrReplace(doc);
  } catch (err: any) {
    console.warn('[Sanity AI Sync] Error saving AI job to Sanity:', err.message);
  }

  // Update local cache
  try {
    const current = existsSync(JOBS_PATH) ? JSON.parse(readFileSync(JOBS_PATH, 'utf8')) : [];
    const idx = current.findIndex((j: any) => j.id === job.id);
    if (idx >= 0) current[idx] = job;
    else current.unshift(job);
    writeFileSync(JOBS_PATH, JSON.stringify(current.slice(0, 100), null, 2), 'utf8');
  } catch {}

  return job;
}
