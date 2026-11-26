import { getAllValidReelScaleUrls, ReelScaleUrlEntity, isValidReelScaleUrl } from "./url-registry";
import { getPromptTemplateById, renderPrompt } from "../ai/prompt-service";
import { callGroqWithRetry } from "../ai/groq-client";

export interface InternalLinkRecommendation {
  url: string;
  anchor_text: string;
  sentence_context: string;
}

export async function generateInternalLinks(params: {
  title: string;
  category: string;
  content: string;
  currentSlug?: string;
}): Promise<{
  linkedMarkdown: string;
  recommendations: InternalLinkRecommendation[];
}> {
  const allUrls = await getAllValidReelScaleUrls();

  // Exclude current slug from internal links to prevent self-linking loops
  const eligibleUrls = allUrls.filter(
    (u) => !params.currentSlug || (!u.path.includes(params.currentSlug) && !u.url.includes(params.currentSlug))
  );

  // Group into High Priority (core + matching industry) and General
  const highPriority = eligibleUrls.filter(
    (u) =>
      u.type === "core" ||
      u.type === "service" ||
      (u.industry && u.industry.toLowerCase() === params.category.toLowerCase())
  );
  const others = eligibleUrls.filter((u) => !highPriority.includes(u));
  const candidatePool = [...highPriority.slice(0, 10), ...others.slice(0, 12)];

  const urlContextList = candidatePool
    .map((u) => `- URL: ${u.url} | Title: "${u.title}" | Keywords: [${u.keywords.slice(0, 4).join(", ")}]`)
    .join("\n");

  const template = await getPromptTemplateById("internal_linking");
  const sysPrompt =
    template?.system_prompt ||
    `You are an Internal Linking Specialist for ReelScale. Recommend exactly 5 to 6 natural, contextual anchor text insertions into the article pointing to reelscale.in URLs. Return a JSON object with key "links": array of 5 to 6 objects with keys: "url", "anchor_text", "sentence_context". Only use exact provided reelscale.in URLs. Every article must have 5-6 backlinks for reelscale.in.`;

  const renderedUserPrompt = renderPrompt(
    template?.user_template ||
      `Available Valid URLs:\n{{valid_urls}}\n\nArticle Content:\n{{content}}\n\nRecommend exactly 5 to 6 natural internal link insertions pointing to reelscale.in in JSON format.`,
    {
      valid_urls: urlContextList,
      content: params.content.slice(0, 4000), // pass substantial body
    }
  );

  let recommendations: InternalLinkRecommendation[] = [];

  try {
    const aiPromise = callGroqWithRetry({
      messages: [
        {
          role: "system",
          content:
            "You are an Internal Linking Specialist for ReelScale. You MUST return exactly 5 to 6 natural contextual links pointing to reelscale.in. Return ONLY valid JSON: {\"links\": [{\"url\": \"...\", \"anchor_text\": \"...\", \"sentence_context\": \"...\"}]}",
        },
        {
          role: "user",
          content: `${renderedUserPrompt}\n\nRespond ONLY with a valid JSON object: {"links":[{"url":"...","anchor_text":"...","sentence_context":"..."}]}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      stage: "internal_linking",
      response_format: { type: "json_object" },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Internal linking AI timeout (2s)")), 2000)
    );

    const res = (await Promise.race([aiPromise, timeoutPromise])) as any;

    try {
      const parsed = JSON.parse(res.content);
      const list = Array.isArray(parsed) ? parsed : parsed.links || parsed.recommendations || [];
      recommendations = list.filter((item: any) => {
        if (!item?.url || !item?.anchor_text) return false;
        return isValidReelScaleUrl(item.url, candidatePool);
      });
    } catch {
      // Regex fallback if JSON has envelope
      const match = res.content.match(/\[[\s\S]*\]/);
      if (match) {
        const list = JSON.parse(match[0]);
        recommendations = list.filter((item: any) => isValidReelScaleUrl(item.url, candidatePool));
      }
    }
  } catch (err) {
    console.warn("AI internal linking call failed, applying algorithmic fallback:", err);
  }

  // 1. Apply AI recommendations into Markdown content
  let updatedMarkdown = params.content;
  const appliedUrls = new Set<string>();

  for (const rec of recommendations) {
    if (appliedUrls.size >= 6) break;
    const canonicalUrl = normalizeToReelScaleUrl(rec.url);
    if (appliedUrls.has(canonicalUrl)) continue;
    if (!rec.anchor_text || rec.anchor_text.length < 3) continue;

    if (updatedMarkdown.includes(`(${canonicalUrl})`)) {
      appliedUrls.add(canonicalUrl);
      continue;
    }

    const escapedAnchor = rec.anchor_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const linkRegex = new RegExp(`(?<!\\[|#.*)\\b(${escapedAnchor})\\b(?!\\]|\\))`, "i");

    if (linkRegex.test(updatedMarkdown)) {
      updatedMarkdown = updatedMarkdown.replace(linkRegex, `[$1](${canonicalUrl})`);
      appliedUrls.add(canonicalUrl);
    }
  }

  // 2. If fewer than 5 links, execute deterministic in-text keyword replacement
  if (appliedUrls.size < 5) {
    const fallbackRecs = fallbackLinkDiscovery(updatedMarkdown, candidatePool, params.currentSlug, appliedUrls);
    for (const rec of fallbackRecs) {
      if (appliedUrls.size >= 6) break;
      const canonicalUrl = normalizeToReelScaleUrl(rec.url);
      if (appliedUrls.has(canonicalUrl)) continue;

      const escapedAnchor = rec.anchor_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const linkRegex = new RegExp(`(?<!\\[|#.*)\\b(${escapedAnchor})\\b(?!\\]|\\))`, "i");

      if (linkRegex.test(updatedMarkdown)) {
        updatedMarkdown = updatedMarkdown.replace(linkRegex, `[$1](${canonicalUrl})`);
        appliedUrls.add(canonicalUrl);
        recommendations.push(rec);
      }
    }
  }

  // 3. Guarantee 5-6 backlinks: If STILL fewer than 5 links, contextually integrate core ReelScale resource backlinks
  if (appliedUrls.size < 5) {
    const guaranteedCorePages = [
      { url: "https://reelscale.in/services", anchor: "video production services", desc: "comprehensive on-location packages" },
      { url: "https://reelscale.in/pricing", anchor: "pricing packages", desc: "transparent 10-minute turnaround video plans" },
      { url: "https://reelscale.in/works", anchor: "case studies and portfolio", desc: "verified social growth metrics" },
      { url: "https://reelscale.in/reels-shoot-hyderabad", anchor: "reels shoot in Hyderabad", desc: "rapid on-location smartphone videography" },
      { url: "https://reelscale.in/growth", anchor: "Instagram growth strategies", desc: "actionable local reach frameworks" },
      { url: "https://reelscale.in/", anchor: "ReelScale", desc: "mobile-first video agency" },
    ];

    const neededLinks = 5 - appliedUrls.size;
    const additions: string[] = [];

    for (const item of guaranteedCorePages) {
      if (appliedUrls.size >= 5) break;
      if (!appliedUrls.has(item.url)) {
        appliedUrls.add(item.url);
        additions.push(`- Explore our [${item.anchor}](${item.url}) for ${item.desc}.`);
        recommendations.push({
          url: item.url,
          anchor_text: item.anchor,
          sentence_context: `Strategic ReelScale resource link: ${item.desc}`,
        });
      }
    }

    if (additions.length > 0) {
      const resourceBlock = `\n\n### Strategic ReelScale Resources & Next Steps\n${additions.join("\n")}\n`;
      // Place right before FAQs (## Frequently Asked Questions) or before the conclusion
      if (updatedMarkdown.includes("## Frequently Asked Questions")) {
        updatedMarkdown = updatedMarkdown.replace("## Frequently Asked Questions", `${resourceBlock}\n## Frequently Asked Questions`);
      } else {
        updatedMarkdown += resourceBlock;
      }
    }
  }

  // 4. Cap at 6 links maximum if there are excess links
  const allFoundLinks = extractAllReelScaleLinks(updatedMarkdown);
  if (allFoundLinks.length > 6) {
    const keepUrls = new Set<string>();
    let validCount = 0;
    for (const l of allFoundLinks) {
      if (validCount < 6 && !keepUrls.has(l.url)) {
        keepUrls.add(l.url);
        validCount++;
      } else if (!keepUrls.has(l.url)) {
        // Unwrap excess link back to plain text
        updatedMarkdown = updatedMarkdown.replace(l.fullMatch, l.text);
      }
    }
  }

  return {
    linkedMarkdown: updatedMarkdown,
    recommendations,
  };
}

function normalizeToReelScaleUrl(url: string): string {
  if (url.startsWith("/")) {
    return `https://reelscale.in${url}`;
  }
  return url;
}

function extractAllReelScaleLinks(md: string): { text: string; url: string; fullMatch: string }[] {
  const linkRegex = /\[([^\]]+)\]\(((?:https:\/\/reelscale\.in|\/)[^)]*)\)/gi;
  const matches: { text: string; url: string; fullMatch: string }[] = [];
  let m;
  while ((m = linkRegex.exec(md)) !== null) {
    matches.push({ text: m[1], url: normalizeToReelScaleUrl(m[2]), fullMatch: m[0] });
  }
  return matches;
}

function fallbackLinkDiscovery(
  content: string,
  candidatePool: ReelScaleUrlEntity[],
  currentSlug?: string,
  alreadyAppliedUrls?: Set<string>
): InternalLinkRecommendation[] {
  const recommendations: InternalLinkRecommendation[] = [];
  const lowerContent = content.toLowerCase();

  for (const entity of candidatePool) {
    const canonical = normalizeToReelScaleUrl(entity.url);
    if (alreadyAppliedUrls && alreadyAppliedUrls.has(canonical)) continue;

    if (currentSlug && (entity.path.includes(currentSlug) || entity.url.includes(currentSlug))) {
      continue;
    }

    for (const kw of entity.keywords) {
      if (kw.length >= 4 && lowerContent.includes(kw.toLowerCase())) {
        recommendations.push({
          url: canonical,
          anchor_text: kw,
          sentence_context: `Contextually references ${entity.title}`,
        });
        break;
      }
    }

    if (recommendations.length >= 8) break;
  }

  return recommendations;
}
