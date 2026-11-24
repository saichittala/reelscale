import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { executeMultiStageBlogGeneration } from "../ai/ai-pipeline";
import { syncBlogToSanity } from "../../sanity/blog-sync";
import { getSeoTopics, researchAndSuggestTopics, getExistingContentCatalog } from "../seo/topic-engine";
import { saveSeoTopicToSanity } from "../../sanity/ai-sync";
import { slugify, stripDuplicateTitleHeading } from "../blog-utils";
import { redisInvalidatePattern } from "../redis";
import { Blog } from "../../dashboard/types";
import { logExecutionHistory } from "../queue/job-queue";

export interface StagedBlogItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  primary_keyword?: string;
  featuredImage: string;
  content: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  faq: { question: string; answer: string }[];
  wordCount: number;
  scheduledDate: string; // YYYY-MM-DD
  dayNumber: number; // 1 to 30
  status: "staged" | "published";
  createdAt: string;
  publishedAt?: string;
  sanityDocId?: string | null;
}

export interface RollingBufferState {
  targetSize: number; // default 30
  autoPublishDaily: boolean;
  autoReplenish: boolean;
  dailyPublishTime: string; // "11:30"
  stagedBlogs: StagedBlogItem[];
  publishedHistory: StagedBlogItem[];
  lastPublishedAt?: string | null;
  nextScheduledPublish?: string | null;
  updatedAt: string;
}

const BUFFER_FILE = join(process.cwd(), "content", "ai-buffer.json");
const BLOGS_FILE = join(process.cwd(), "content", "blogs.json");

/**
 * Reads the rolling buffer state from content/ai-buffer.json with resilient defaults
 */
export function getRollingBufferState(): RollingBufferState {
  try {
    if (existsSync(BUFFER_FILE)) {
      const raw = readFileSync(BUFFER_FILE, "utf8");
      const parsed = JSON.parse(raw || "{}");
      return {
        targetSize: typeof parsed.targetSize === "number" ? parsed.targetSize : 0,
        autoPublishDaily: parsed.autoPublishDaily !== undefined ? parsed.autoPublishDaily : true,
        autoReplenish: parsed.autoReplenish !== undefined ? parsed.autoReplenish : false,
        dailyPublishTime: parsed.dailyPublishTime || "11:30",
        stagedBlogs: Array.isArray(parsed.stagedBlogs) ? parsed.stagedBlogs : [],
        publishedHistory: Array.isArray(parsed.publishedHistory) ? parsed.publishedHistory : [],
        lastPublishedAt: parsed.lastPublishedAt || null,
        nextScheduledPublish: parsed.nextScheduledPublish || null,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err: any) {
    console.warn("Notice reading ai-buffer.json:", err?.message);
  }

  return {
    targetSize: 0,
    autoPublishDaily: true,
    autoReplenish: false,
    dailyPublishTime: "11:30",
    stagedBlogs: [],
    publishedHistory: [],
    lastPublishedAt: null,
    nextScheduledPublish: null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Persists the buffer state to content/ai-buffer.json
 */
export function saveRollingBufferState(state: RollingBufferState) {
  try {
    state.updatedAt = new Date().toISOString();
    // Recalculate next scheduled publish date based on first staged blog
    if (state.stagedBlogs.length > 0) {
      const first = state.stagedBlogs[0];
      state.nextScheduledPublish = `${first.scheduledDate} at ${state.dailyPublishTime} (Asia/Kolkata)`;
    } else {
      state.nextScheduledPublish = null;
    }
    writeFileSync(BUFFER_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err: any) {
    console.error("Failed to write content/ai-buffer.json:", err);
  }
}

function updateLocalBlogsCache(newBlog: Blog) {
  try {
    let blogs: Blog[] = [];
    if (existsSync(BLOGS_FILE)) {
      const content = readFileSync(BLOGS_FILE, "utf8");
      blogs = JSON.parse(content || "[]");
    }
    const filtered = blogs.filter(
      (b) => b.slug !== newBlog.slug && b.id !== newBlog.id
    );
    filtered.unshift(newBlog);
    writeFileSync(BLOGS_FILE, JSON.stringify(filtered, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to update local content/blogs.json cache:", e);
  }
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Calculates scheduled dates for items based on day numbers
 */
function getScheduledDateForDay(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return formatDate(d);
}

/**
 * Generates and stages a single complete blog (article content + royalty-free photo + SEO links)
 */
export async function generateSingleStagedBlog(params?: {
  title?: string;
  category?: string;
  dayNumber?: number;
}): Promise<StagedBlogItem> {
  const state = getRollingBufferState();
  const dayNumber = params?.dayNumber || state.stagedBlogs.length + 1;
  const scheduledDate = getScheduledDateForDay(dayNumber);

  let targetTitle = params?.title;
  let targetCategory = params?.category || "Video Production";
  let primaryKeyword = "";

  // Helper to normalize strings for exact duplicate prevention
  const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // If title was not provided, pick next available suggested SEO topic
  if (!targetTitle || !targetTitle.trim()) {
    try {
      const catalog = await getExistingContentCatalog().catch(() => ({ titles: [], slugs: [] }));

      const existingTitles = new Set<string>([
        ...catalog.titles.map(norm),
        ...state.stagedBlogs.map((b) => norm(b.title)),
        ...state.publishedHistory.map((b) => norm(b.title)),
      ]);

      const existingSlugs = new Set<string>([
        ...catalog.slugs.map((s) => s.toLowerCase().trim()),
        ...state.stagedBlogs.map((b) => b.slug.toLowerCase().trim()),
        ...state.publishedHistory.map((b) => b.slug.toLowerCase().trim()),
      ]);

      let topics = await getSeoTopics("suggested");
      if (!topics || topics.length < 5) {
        await researchAndSuggestTopics(10).catch(() => { });
        topics = await getSeoTopics("suggested");
      }

      const available = (topics || []).filter((t) => {
        if (t.status && t.status !== "suggested") return false;
        const normTopicTitle = norm(t.title);
        const normTopicSlug = (t.slug || slugify(t.title)).toLowerCase().trim();
        if (existingTitles.has(normTopicTitle)) return false;
        if (existingSlugs.has(normTopicSlug)) return false;
        return true;
      });

      if (available.length > 0) {
        const top = available[0];
        targetTitle = top.title;
        targetCategory = top.category || targetCategory;
        primaryKeyword = top.primary_keyword || "";

        // Mark topic as staged in Sanity & local cache so subsequent fills won't pick it
        try {
          await saveSeoTopicToSanity({
            ...top,
            status: "staged" as any,
          });
        } catch { }
      }
    } catch (e: any) {
      console.warn("Topic selection notice for buffer replenishment:", e?.message);
    }
  }

  const finalTitle = (targetTitle && targetTitle.trim())
    ? targetTitle.trim()
    : `High-ROI Instagram Reels Guide for Hyderabad Businesses - Part ${dayNumber}`;

  // Execute full 8-stage pipeline with content generation and verified photo selection
  const result = await executeMultiStageBlogGeneration({
    topicTitle: finalTitle,
    category: targetCategory,
    primaryKeyword,
  });

  const cleanedContent = stripDuplicateTitleHeading(result.blog.content || "", result.blog.title);

  const stagedBlog: Blog = {
    ...result.blog,
    content: cleanedContent,
    status: "Draft", // Staged blogs remain as Drafts in Sanity until daily publish
    publishedDate: scheduledDate,
    updatedDate: formatDate(new Date()),
  };

  // Sync drafted blog to Sanity Content Lake
  let sanityDocId: string | null = null;
  try {
    const synced = await syncBlogToSanity(stagedBlog);
    sanityDocId = synced.id ? String(synced.id) : null;
  } catch (sanityErr: any) {
    console.warn("Sanity draft staging sync notice:", sanityErr?.message || sanityErr);
  }

  // Update local blogs cache as Draft
  updateLocalBlogsCache({ ...stagedBlog, id: sanityDocId || stagedBlog.id });

  const stagedItem: StagedBlogItem = {
    id: `staged_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: result.blog.title,
    slug: result.blog.slug,
    category: result.blog.category || targetCategory,
    primary_keyword: primaryKeyword,
    featuredImage: result.blog.featuredImage || "",
    content: cleanedContent,
    description: result.blog.description || "",
    metaTitle: result.blog.metaTitle,
    metaDescription: result.blog.metaDescription,
    tags: result.blog.tags || [],
    faq: result.blog.faq || [],
    wordCount: result.validationReport?.wordCount || 1500,
    scheduledDate,
    dayNumber,
    status: "staged",
    createdAt: new Date().toISOString(),
    sanityDocId,
  };

  return stagedItem;
}

// Concurrency flag for background buffer replenishment worker
let isBufferWorkerActive = false;

export function isBufferFillingActive(): boolean {
  return isBufferWorkerActive;
}

/**
 * Starts background worker to fill the rolling buffer up to targetCount (default: 30)
 */
export function startBackgroundBufferFill(targetCount: number = 30): boolean {
  if (isBufferWorkerActive) return false;
  isBufferWorkerActive = true;

  (async () => {
    try {
      while (true) {
        const state = getRollingBufferState();
        if (state.stagedBlogs.length >= targetCount) {
          break;
        }
        const nextDayNumber = state.stagedBlogs.length + 1;
        const newStagedBlog = await generateSingleStagedBlog({
          dayNumber: nextDayNumber,
        });

        const freshState = getRollingBufferState();
        freshState.stagedBlogs.push(newStagedBlog);
        freshState.stagedBlogs = freshState.stagedBlogs.map((b, idx) => ({
          ...b,
          dayNumber: idx + 1,
          scheduledDate: getScheduledDateForDay(idx + 1),
        }));
        saveRollingBufferState(freshState);

        await logExecutionHistory(
          `buffer_fill_${Date.now()}`,
          "buffer_staging",
          "completed",
          `Pre-generated & staged "${newStagedBlog.title}" (Buffer: ${freshState.stagedBlogs.length}/${targetCount})`
        );
      }
    } catch (err: any) {
      console.error("Background buffer fill error:", err?.message || err);
    } finally {
      isBufferWorkerActive = false;
    }
  })();

  return true;
}

/**
 * Ensures the rolling buffer maintains up to targetCount (default: 30) blogs.
 * Generates and stages missing blogs sequentially.
 */
export async function ensureRollingBuffer(
  targetCount: number = 30,
  onProgress?: (current: number, total: number, latestBlog: StagedBlogItem) => void
): Promise<{ added: number; totalStaged: number; state: RollingBufferState }> {
  let state = getRollingBufferState();
  state.targetSize = targetCount;

  let added = 0;
  while (state.stagedBlogs.length < targetCount) {
    const nextDayNumber = state.stagedBlogs.length + 1;
    const newStagedBlog = await generateSingleStagedBlog({
      dayNumber: nextDayNumber,
    });

    state = getRollingBufferState();
    state.stagedBlogs.push(newStagedBlog);
    state.stagedBlogs = state.stagedBlogs.map((b, idx) => ({
      ...b,
      dayNumber: idx + 1,
      scheduledDate: getScheduledDateForDay(idx + 1),
    }));
    saveRollingBufferState(state);
    added++;

    if (onProgress) {
      onProgress(state.stagedBlogs.length, targetCount, newStagedBlog);
    }
  }

  return { added, totalStaged: state.stagedBlogs.length, state };
}

/**
 * Publishes the next scheduled blog from the buffer to production,
 * removes it from the staged buffer, and INSTANTLY triggers replenishment
 * to keep the buffer at exactly 30 blogs.
 */
export async function publishNextDailyBlog(): Promise<{
  publishedBlog: Blog;
  replenishedBlog: StagedBlogItem | null;
  bufferState: RollingBufferState;
}> {
  const state = getRollingBufferState();

  if (state.stagedBlogs.length === 0) {
    throw new Error("No staged blogs available in buffer. Please replenish the 30-blog buffer.");
  }

  // 1. Remove the first staged blog from buffer (earliest scheduled post)
  const blogToPublishItem = state.stagedBlogs.shift()!;
  const today = formatDate(new Date());

  const blogToPublish: Blog = {
    id: blogToPublishItem.sanityDocId || blogToPublishItem.id,
    title: blogToPublishItem.title,
    slug: blogToPublishItem.slug,
    category: blogToPublishItem.category,
    description: blogToPublishItem.description,
    featuredImage: blogToPublishItem.featuredImage,
    content: blogToPublishItem.content,
    publishedDate: today,
    updatedDate: today,
    status: "Published", // Published directly to production!
    tags: blogToPublishItem.tags,
    metaTitle: blogToPublishItem.metaTitle,
    metaDescription: blogToPublishItem.metaDescription,
    focusKeyword: blogToPublishItem.primary_keyword,
    faq: blogToPublishItem.faq,
  };

  // 2. Publish to Sanity Production Content Lake
  let syncedBlog = blogToPublish;
  try {
    syncedBlog = await syncBlogToSanity(blogToPublish);
  } catch (err: any) {
    console.warn("Sanity production publish notice:", err?.message || err);
  }

  // 3. Update local blogs cache
  updateLocalBlogsCache(syncedBlog);

  // 4. Invalidate Redis edge caches
  try {
    await redisInvalidatePattern("sanity:*");
    await redisInvalidatePattern("sanity:blogs:*");
  } catch { }

  // 5. Trigger Next.js on-demand ISR revalidation
  try {
    revalidatePath("/blog", "page");
    if (syncedBlog.slug) {
      revalidatePath(`/blog/${syncedBlog.slug}`, "page");
    }
    revalidatePath("/", "layout");
  } catch { }

  // 6. Record to published history
  const publishedItem: StagedBlogItem = {
    ...blogToPublishItem,
    status: "published",
    publishedAt: new Date().toISOString(),
  };
  state.publishedHistory.unshift(publishedItem);
  state.lastPublishedAt = new Date().toISOString();

  // Re-index remaining staged blogs day numbers & scheduled dates
  state.stagedBlogs = state.stagedBlogs.map((b, idx) => ({
    ...b,
    dayNumber: idx + 1,
    scheduledDate: getScheduledDateForDay(idx + 1),
  }));

  saveRollingBufferState(state);

  await logExecutionHistory(
    `daily_publish_${Date.now()}`,
    "daily_buffer_publish",
    "completed",
    `Published daily blog "${syncedBlog.title}" live to production.`
  );

  // Mark topic as published in Sanity/cache
  try {
    const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const allTopics = await getSeoTopics();
    const matched = allTopics.find(
      (t) => norm(t.title) === norm(syncedBlog.title) || t.slug === syncedBlog.slug
    );
    if (matched) {
      await saveSeoTopicToSanity({ ...matched, status: "published" as any });
    }
  } catch { }

  // 7. INSTANT REPLENISHMENT: Trigger background generation of 1 new blog to replace the published one
  if (state.autoReplenish && state.stagedBlogs.length < state.targetSize) {
    (async () => {
      try {
        const replenishedBlog = await generateSingleStagedBlog({
          dayNumber: state.targetSize, // Placed at the end of the 30-day line
        });
        const freshState = getRollingBufferState();
        freshState.stagedBlogs.push(replenishedBlog);
        freshState.stagedBlogs = freshState.stagedBlogs.map((b, idx) => ({
          ...b,
          dayNumber: idx + 1,
          scheduledDate: getScheduledDateForDay(idx + 1),
        }));
        saveRollingBufferState(freshState);

        await logExecutionHistory(
          `replenish_${Date.now()}`,
          "instant_replenish",
          "completed",
          `Instantly replenished buffer with new staged blog "${replenishedBlog.title}" (Day ${freshState.stagedBlogs.length}).`
        );
      } catch (replenishErr: any) {
        console.error("Instant replenishment notice:", replenishErr?.message || replenishErr);
      }
    })();
  }

  const finalState = getRollingBufferState();
  return {
    publishedBlog: syncedBlog,
    replenishedBlog: null,
    bufferState: finalState,
  };
}
