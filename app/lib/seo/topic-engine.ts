import { getDb } from "../db";
import { getPublishedBlogsAsync } from "../blog";
import { getPromptTemplateById, renderPrompt } from "../ai/prompt-service";
import { callGroqWithRetry } from "../ai/groq-client";
import { slugify } from "../blog-utils";
import { getSeoTopicsFromSanity, saveSeoTopicToSanity } from "../../sanity/ai-sync";

export interface SeoTopic {
  id: number;
  title: string;
  slug: string;
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: "Informational" | "Commercial" | "Transactional" | "Navigational";
  target_audience: string;
  category: string;
  business_relevance: string;
  content_priority: "High" | "Medium" | "Low";
  status: "suggested" | "approved" | "queued" | "generating" | "published" | "rejected";
  existing_related_articles?: string[];
  reason_for_creation?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getExistingContentCatalog(): Promise<{
  titles: string[];
  slugs: string[];
  keywords: string[];
  categories: string[];
  summaryText: string;
}> {
  const blogs = await getPublishedBlogsAsync();
  const titles = blogs.map((b) => b.title).filter(Boolean);
  const slugs = blogs.map((b) => b.slug).filter(Boolean);
  const keywords = blogs.map((b) => b.focusKeyword || "").filter(Boolean);
  const categories = Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)));

  const summaryLines = blogs.slice(0, 40).map((b) => {
    return `- Title: "${b.title}" | Slug: /blog/${b.slug} | Category: ${b.category} | Keyword: "${b.focusKeyword || ""}"`;
  });

  return {
    titles,
    slugs,
    keywords,
    categories,
    summaryText: summaryLines.join("\n"),
  };
}

export async function researchAndSuggestTopics(targetCount = 5): Promise<SeoTopic[]> {
  const catalog = await getExistingContentCatalog();
  const template = await getPromptTemplateById("topic_research");

  const sysPrompt =
    template?.system_prompt ||
    `You are an SEO Content Strategist for ReelScale Hyderabad. Discover high-performing short-form video topics with zero keyword cannibalization. Output valid JSON array with proposed topics.`;

  const renderedUserPrompt = renderPrompt(
    template?.user_template ||
    `Existing Published & Draft Titles/Slugs:\n{{existing_articles}}\n\nAnalyze these existing assets and propose {{target_count}} unique, high-priority blog topics in valid JSON format.`,
    {
      existing_articles: catalog.summaryText || "None yet. Initializing content catalog.",
      target_count: targetCount,
    }
  );

  const res = await callGroqWithRetry({
    messages: [
      { role: "system", content: sysPrompt },
      {
        role: "user",
        content: `${renderedUserPrompt}\n\nRespond ONLY with a JSON object: {"topics": [{"title":"...","primary_keyword":"...","secondary_keywords":["..."],"search_intent":"Informational|Commercial|Transactional","target_audience":"...","category":"...","business_relevance":"...","proposed_slug":"...","content_priority":"High|Medium","reason_for_creation":"..."}]}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 3000,
    stage: "topic_research",
    response_format: { type: "json_object" },
  });

  let rawTopics: any[] = [];
  try {
    const parsed = JSON.parse(res.content);
    rawTopics = Array.isArray(parsed) ? parsed : parsed.topics || parsed.data || [];
  } catch (e) {
    console.warn("Failed to parse topic research JSON from Groq:", e);
  }

  const sql = getDb();
  const insertedTopics: SeoTopic[] = [];

  for (const item of rawTopics) {
    if (!item?.title || !item?.primary_keyword) continue;

    const baseSlug = item.proposed_slug ? slugify(item.proposed_slug) : slugify(item.title);
    let finalSlug = baseSlug;

    // Check cannibalization with existing blogs
    if (catalog.slugs.includes(finalSlug)) {
      finalSlug = `${finalSlug}-guide`;
    }

    const topicObj: SeoTopic = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: item.title,
      slug: finalSlug,
      primary_keyword: item.primary_keyword,
      secondary_keywords: Array.isArray(item.secondary_keywords) ? item.secondary_keywords : [],
      search_intent: item.search_intent || "Commercial",
      target_audience: item.target_audience || "Hyderabad Business Owners",
      category: item.category || "Video Production",
      business_relevance: item.business_relevance || "Direct inbound lead generation for ReelScale 10-minute on-location shoots",
      content_priority: item.content_priority || "High",
      status: "suggested",
      existing_related_articles: catalog.titles.slice(0, 3),
      reason_for_creation: item.reason_for_creation || "High-intent search gap with strong local commercial interest",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Primary Save to Sanity Content Lake
    await saveSeoTopicToSanity(topicObj as any).catch(() => { });
    insertedTopics.push(topicObj);

    // 2. Optional sync to Neon if configured
    try {
      const sql = getDb();
      const existing = await sql.query(
        "SELECT id, status FROM seo_topics WHERE slug = $1 LIMIT 1;",
        [finalSlug]
      );

      if (existing.length === 0) {
        await sql.query(
          `INSERT INTO seo_topics (
            title, slug, primary_keyword, secondary_keywords, search_intent,
            target_audience, category, business_relevance, content_priority,
            status, existing_related_articles, reason_for_creation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'suggested', $10, $11);`,
          [
            item.title,
            finalSlug,
            item.primary_keyword,
            JSON.stringify(Array.isArray(item.secondary_keywords) ? item.secondary_keywords : []),
            item.search_intent || "Commercial",
            item.target_audience || "Hyderabad Business Owners",
            item.category || "Video Production",
            item.business_relevance || "Direct inbound lead generation for ReelScale 10-minute on-location shoots",
            item.content_priority || "High",
            JSON.stringify(catalog.titles.slice(0, 3)),
            item.reason_for_creation || "High-intent search gap with strong local commercial interest",
          ]
        );
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return insertedTopics;
}

export async function getSeoTopics(statusFilter?: string): Promise<SeoTopic[]> {
  // 1. Check Sanity CMS Content Lake first
  try {
    const sanityTopics = await getSeoTopicsFromSanity();
    if (Array.isArray(sanityTopics) && sanityTopics.length > 0) {
      if (statusFilter && statusFilter !== "all") {
        return sanityTopics.filter((t) => t.status === statusFilter) as any;
      }
      return sanityTopics as any;
    }
  } catch { }

  // 2. Secondary fallback to DB if linked
  try {
    const sql = getDb();
    if (statusFilter && statusFilter !== "all") {
      const rows = await sql.query(
        `SELECT * FROM seo_topics WHERE status = $1 ORDER BY id DESC;`,
        [statusFilter]
      );
      return rows as SeoTopic[];
    }
    const rows = await sql.query(`SELECT * FROM seo_topics ORDER BY id DESC;`);
    return rows as SeoTopic[];
  } catch {
    return [];
  }
}

export async function updateTopicStatus(
  topicId: number,
  status: "suggested" | "approved" | "queued" | "generating" | "published" | "rejected"
): Promise<SeoTopic> {
  // 1. Update in Sanity
  try {
    const all = await getSeoTopics();
    const found = all.find((t) => t.id === topicId);
    if (found) {
      found.status = status;
      found.updated_at = new Date().toISOString();
      await saveSeoTopicToSanity(found as any);
    }
  } catch { }

  // 2. Update in DB if available
  try {
    const sql = getDb();
    const rows = await sql.query(
      `UPDATE seo_topics SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
      [status, topicId]
    );
    if (rows.length > 0) return rows[0] as SeoTopic;
  } catch { }

  return { id: topicId, status } as any;
}
