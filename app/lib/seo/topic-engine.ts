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
  const existingTopics = await getSeoTopics().catch(() => []);

  const titles = [
    ...blogs.map((b) => b.title).filter(Boolean),
    ...existingTopics.map((t) => t.title).filter(Boolean),
  ];
  const slugs = [
    ...blogs.map((b) => b.slug).filter(Boolean),
    ...existingTopics.map((t) => t.slug).filter(Boolean),
  ];
  const keywords = blogs.map((b) => b.focusKeyword || "").filter(Boolean);
  const categories = Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)));

  const summaryLines = blogs.slice(0, 30).map((b) => {
    return `- Title: "${b.title}" | Slug: /blog/${b.slug} | Category: ${b.category}`;
  });

  return {
    titles,
    slugs,
    keywords,
    categories,
    summaryText: summaryLines.join("\n"),
  };
}

/**
 * Normalizes text by replacing synonyms for short-form video platforms, conversion intents,
 * real estate/business entities, and cities so duplicate search intents match cleanly.
 */
export function normalizeSemanticTokens(text: string): string[] {
  if (!text) return [];
  let s = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  // 1. Format / Channel synonyms
  s = s.replace(/\b(short[\s\-]?form video|instagram reels?|reels?|tiktok|youtube shorts?|shorts?)\b/g, " tokenvideo ");
  s = s.replace(/\b(video production|reel makers?|video shoots?|reel creators?)\b/g, " tokenprod ");
  s = s.replace(/\b(paid ads|reel ads|instagram reel ads|meta ads|advertising)\b/g, " tokenads ");

  // 2. Goal / Intent synonyms
  s = s.replace(/\b(close deals? faster|close more deals?|close deals?|sell properties faster|sell properties|land clients|generate leads|lead generation|inbound leads?)\b/g, " tokendeals ");
  s = s.replace(/\b(drive footfall|table reservations|drive reservations|fill tables?)\b/g, " tokenfootfall ");
  s = s.replace(/\b(step[\s\-]?by[\s\-]?step guide|complete guide|blueprint|playbook|strategies|tactics|framework)\b/g, " tokenguide ");

  // 3. Industry synonyms
  s = s.replace(/\b(real estate agents?|real estate brokers?|realtors?|property agents?|real estate|realty)\b/g, " tokenrealestate ");
  s = s.replace(/\b(restaurants?|cafes?|bistros?|dining)\b/g, " tokenrestaurant ");
  s = s.replace(/\b(tech founders?|startup founders?|executives?|entrepreneurs?)\b/g, " tokenfounder ");
  s = s.replace(/\b(interior designers?|interior design studios?|home decor)\b/g, " tokeninterior ");
  s = s.replace(/\b(small businesses?|smbs?|local businesses?|local brands?)\b/g, " tokensmb ");

  // 4. Geo synonyms
  s = s.replace(/\b(hyderabad|cyberabad|secunderabad)\b/g, " tokenhyd ");

  const stopWords = new Set([
    "the", "for", "and", "with", "how", "why", "what", "to", "in", "a", "an", "of", "on", "can", "use", "using", "your", "more"
  ]);

  return s
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

export interface TopicCluster {
  industry: string;
  location: string;
  format: string;
  intent: string;
}

/**
 * Extracts the 4-tuple Topic Cluster [industry, location, format, intent]
 * to prevent keyword cannibalization on local search engines.
 */
export function extractTopicCluster(title: string): TopicCluster {
  const lower = (title || "").toLowerCase();

  // Industry detection
  let industry = "general_business";
  if (/real estate|realtor|propert|housing|apartment|villa/i.test(lower)) industry = "real_estate";
  else if (/restaurant|cafe|food|dining|reservation/i.test(lower)) industry = "restaurant";
  else if (/tech founder|startup|executive|b2b/i.test(lower)) industry = "tech_founder";
  else if (/interior design|decor|home styling/i.test(lower)) industry = "interior_design";
  else if (/clinic|dental|aesthetic|doctor|hospital/i.test(lower)) industry = "healthcare";
  else if (/gym|fitness|crossfit|workout/i.test(lower)) industry = "fitness";
  else if (/smb|small business|local business/i.test(lower)) industry = "smb";

  // Location detection
  let location = "general";
  if (/hyderabad|cyberabad|secunderabad/i.test(lower)) location = "hyderabad";
  if (/kokapet|tellapur|mokila|gachibowli|hitec city|madhapur|jubilee hills|banjara hills|kondapur/i.test(lower)) {
    location = "hyderabad_micro";
  }

  // Format detection
  let format = "reels_shortform";
  if (/paid ad|reel ad|advertising|meta ad/i.test(lower)) format = "paid_ads";
  else if (/location|spots?|shooting spot/i.test(lower)) format = "shooting_spots";
  else if (/hashtag/i.test(lower)) format = "hashtags";
  else if (/pricing|cost|how much/i.test(lower)) format = "pricing";
  else if (/diy|professional vs/i.test(lower)) format = "diy_vs_pro";
  else if (/scripting|sound design/i.test(lower)) format = "technical_craft";

  // Intent detection
  let intent = "brand_growth";
  if (/close deal|sell propert|deal|land client|lead|client/i.test(lower)) intent = "conversion_sales";
  else if (/footfall|reservation|fill table/i.test(lower)) intent = "footfall";
  else if (/pricing|cost|rates/i.test(lower)) intent = "cost_inquiry";
  else if (/how to|step by step|guide|playbook|blueprint/i.test(lower)) intent = "how_to_guide";

  return { industry, location, format, intent };
}

/**
 * Checks whether candidate title belongs to an existing [industry + location + format + intent] cluster.
 */
export function isTopicClusterDuplicate(
  candidateTitle: string,
  existingTitles: string[]
): boolean {
  if (!candidateTitle) return false;
  const candCluster = extractTopicCluster(candidateTitle);

  // If candidate is a generic topic without specific industry or location, skip cluster check
  if (candCluster.industry === "general_business" && candCluster.location === "general") {
    return false;
  }

  for (const existing of existingTitles) {
    if (!existing) continue;
    const existCluster = extractTopicCluster(existing);

    if (
      candCluster.industry === existCluster.industry &&
      candCluster.location === existCluster.location &&
      candCluster.format === existCluster.format &&
      candCluster.intent === existCluster.intent
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check whether a candidate headline matches any existing published/posted blog.
 * Performs exact normalized matching, slug matching, semantic token overlap,
 * and topic cluster intent deduplication.
 */
export function isHeadlineDuplicate(
  candidateTitle: string,
  existingBlogs: { title?: string; slug?: string }[],
  similarityThreshold = 0.55
): boolean {
  if (!candidateTitle || !candidateTitle.trim()) return false;

  const cleanCandidate = candidateTitle.trim().toLowerCase();
  const normCandidate = cleanCandidate.replace(/[^a-z0-9]/g, "");
  if (!normCandidate) return false;

  const candidateSlug = slugify(candidateTitle);
  const candidateSemantic = new Set(normalizeSemanticTokens(candidateTitle));
  const candidateTitlesList = existingBlogs.map((b) => b.title || "").filter(Boolean);

  // 1. Topic Cluster intent check
  if (isTopicClusterDuplicate(candidateTitle, candidateTitlesList)) {
    return true;
  }

  for (const b of existingBlogs) {
    const cleanExisting = (b.title || "").trim().toLowerCase();
    const normExisting = cleanExisting.replace(/[^a-z0-9]/g, "");
    const existingSlug = b.slug || slugify(b.title || "");

    // 2. Exact normalized match
    if (normCandidate === normExisting) {
      return true;
    }

    // 3. Slug match
    if (candidateSlug === existingSlug) {
      return true;
    }

    // 4. Substring containment for long titles
    if (normCandidate.length > 20 && normExisting.length > 20) {
      if (normCandidate.includes(normExisting) || normExisting.includes(normCandidate)) {
        return true;
      }
    }

    // 5. Semantic token overlap similarity
    const existingSemantic = new Set(normalizeSemanticTokens(cleanExisting));
    if (candidateSemantic.size > 0 && existingSemantic.size > 0) {
      let intersection = 0;
      for (const w of candidateSemantic) {
        if (existingSemantic.has(w)) intersection++;
      }
      const union = new Set([...candidateSemantic, ...existingSemantic]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      if (jaccard >= similarityThreshold) {
        return true;
      }

      // If at least 4 meaningful semantic tokens match and it is >= 60% of candidate tokens
      if (intersection >= 4 && intersection / candidateSemantic.size >= 0.6) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter an array of topics and discard any that match an existing published/posted blog.
 */
export function filterOutDuplicateTopics(
  topics: SeoTopic[],
  existingBlogs: { title?: string; slug?: string }[]
): SeoTopic[] {
  const existingTitles = existingBlogs.map((b) => b.title || "").filter(Boolean);
  return topics.filter(
    (t) =>
      !isHeadlineDuplicate(t.title, existingBlogs) &&
      !isTopicClusterDuplicate(t.title, existingTitles)
  );
}

/**
 * Returns the next unique topic that does NOT match any published/posted blog.
 * If the requested title matches an existing blog (or is empty), it searches through
 * available suggested topics. If none exist or all are duplicates, it triggers research
 * of fresh new topics.
 */
export async function getUniqueNextTopic(
  existingBlogs: { title?: string; slug?: string }[],
  requestedTitle?: string,
  preferredCategory?: string
): Promise<{ title: string; category: string; primary_keyword: string; topic_id?: number }> {
  const existingTitles = existingBlogs.map((b) => b.title || "").filter(Boolean);

  // 1. Check if the requested title is provided and completely unique
  if (
    requestedTitle &&
    requestedTitle.trim() &&
    !isHeadlineDuplicate(requestedTitle, existingBlogs) &&
    !isTopicClusterDuplicate(requestedTitle, existingTitles)
  ) {
    return {
      title: requestedTitle.trim(),
      category: preferredCategory || "Video Production",
      primary_keyword: requestedTitle.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ""),
    };
  }

  // 2. Retrieve suggested topics and filter out any that match published blogs
  let topics = await getSeoTopics("suggested").catch(() => []);
  let freshTopics = filterOutDuplicateTopics(topics, existingBlogs);

  // 3. If no fresh topics are available, research and discover brand new topics
  if (freshTopics.length === 0) {
    try {
      await researchAndSuggestTopics(5);
      topics = await getSeoTopics("suggested").catch(() => []);
      freshTopics = filterOutDuplicateTopics(topics, existingBlogs);
    } catch (err) {
      console.warn("Topic research call notice in getUniqueNextTopic:", err);
    }
  }

  // 4. If we found a unique topic, return it
  if (freshTopics.length > 0) {
    const top = freshTopics[0];
    return {
      title: top.title,
      category: top.category || preferredCategory || "Video Production",
      primary_keyword: top.primary_keyword,
      topic_id: top.id,
    };
  }

  // 5. Fallback safeguard: Dynamically construct a guaranteed unique headline with distinct angle
  const categories = ["Video Production", "Commercial Ads", "Instagram Growth", "Local Business Marketing"];
  const areas = ["Jubilee Hills", "Gachibowli", "Banjara Hills", "HITEC City", "Madhapur", "Kondapur"];
  const formats = [
    "Complete ROI Blueprint & Production Playbook",
    "On-Location iPhone Shoot Guide: 10-Minute Delivery",
    "How to Scale Inbound Customer Footfall with 10-Minute Video Reels",
    "Comprehensive Case Study & Implementation Framework",
  ];

  const randomArea = areas[Math.floor(Math.random() * areas.length)];
  const randomFormat = formats[Math.floor(Math.random() * formats.length)];
  const currentYear = new Date().getFullYear();

  let fallbackTitle = `${randomFormat} for ${randomArea} Businesses (${currentYear})`;
  let counter = 1;
  while (isHeadlineDuplicate(fallbackTitle, existingBlogs)) {
    fallbackTitle = `${randomFormat} for ${randomArea} Brands (Edition ${counter++})`;
  }

  return {
    title: fallbackTitle,
    category: preferredCategory || categories[0],
    primary_keyword: `video production ${randomArea.toLowerCase()}`,
  };
}

export async function researchAndSuggestTopics(targetCount = 5): Promise<SeoTopic[]> {
  const catalog = await getExistingContentCatalog();
  const template = await getPromptTemplateById("topic_research");

  const sysPrompt =
    template?.system_prompt ||
    `You are an SEO Content Strategist for ReelScale Hyderabad. Discover high-performing short-form video topics with zero keyword cannibalization. Output valid JSON array with proposed topics.`;

  const existingClusters = Array.from(
    new Set(catalog.titles.map((t) => {
      const c = extractTopicCluster(t);
      return `${c.industry} in ${c.location} (${c.format} -> ${c.intent})`;
    }))
  ).slice(0, 15);

  const clusterConstraint = existingClusters.length > 0
    ? `\n\nCRITICAL ANTI-CANNIBALIZATION CONSTRAINT:\nThe following topic clusters ALREADY EXIST. You MUST NOT propose any topic that shares the same industry, location, and intent:\n${existingClusters.map((c) => `- ALREADY COVERED: ${c}`).join("\n")}\n\nInstead, target completely UNTAPPED industries in Hyderabad (e.g., Aesthetic & Dental Clinics, High-End Jewellery, Bridal Couture, Specialty Coffee Roasters, Fitness & Combat Gyms, Pre-Schools, Coworking Spaces).`
    : "";

  const renderedUserPrompt = renderPrompt(
    template?.user_template ||
    `Existing Published & Draft Titles/Slugs:\n{{existing_articles}}\n\nAnalyze these existing assets and propose {{target_count}} unique, high-priority blog topics in valid JSON format.`,
    {
      existing_articles: (catalog.summaryText || "None yet. Initializing content catalog.") + clusterConstraint,
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

    const trimmedTitle = item.title.trim();
    const normTitle = trimmedTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normTitle || normTitle.length < 10) continue;

    // Strict multi-layer deduplication: exact, semantic, cluster, and slug against catalog + newly inserted
    const existingBlogsToCheck = [
      ...catalog.titles.map((t) => ({ title: t })),
      ...insertedTopics.map((t) => ({ title: t.title })),
    ];
    const existingTitlesToCheck = [
      ...catalog.titles,
      ...insertedTopics.map((t) => t.title),
    ];

    if (
      isHeadlineDuplicate(trimmedTitle, existingBlogsToCheck) ||
      isTopicClusterDuplicate(trimmedTitle, existingTitlesToCheck)
    ) {
      console.log(`[TopicEngine] Discarding duplicate/cannibalizing topic: "${trimmedTitle}"`);
      continue;
    }

    const baseSlug = item.proposed_slug ? slugify(item.proposed_slug) : slugify(trimmedTitle);
    if (catalog.slugs.includes(baseSlug) || insertedTopics.some((t) => t.slug === baseSlug)) {
      console.log(`[TopicEngine] Discarding duplicate slug: "${baseSlug}"`);
      continue;
    }

    const topicObj: SeoTopic = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: trimmedTitle,
      slug: baseSlug,
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
        [baseSlug]
      );

      if (existing.length === 0) {
        await sql.query(
          `INSERT INTO seo_topics (
            title, slug, primary_keyword, secondary_keywords, search_intent,
            target_audience, category, business_relevance, content_priority,
            status, existing_related_articles, reason_for_creation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'suggested', $10, $11);`,
          [
            trimmedTitle,
            baseSlug,
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
