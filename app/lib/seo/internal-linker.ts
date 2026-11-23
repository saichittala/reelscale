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
  const candidatePool = [...highPriority.slice(0, 8), ...others.slice(0, 10)];

  const urlContextList = candidatePool
    .map((u) => `- URL: ${u.url} | Title: "${u.title}" | Keywords: [${u.keywords.slice(0, 4).join(", ")}]`)
    .join("\n");

  const template = await getPromptTemplateById("internal_linking");
  const sysPrompt =
    template?.system_prompt ||
    `You are an Internal Linking Specialist. Recommend 3 to 5 natural, contextual anchor text insertions into the article. Return a valid JSON array of objects with keys: "url", "anchor_text", "sentence_context". Only use the exact provided URLs. Never invent URLs.`;

  const renderedUserPrompt = renderPrompt(
    template?.user_template ||
      `Available Valid URLs:\n{{valid_urls}}\n\nArticle Content:\n{{content}}\n\nRecommend natural internal link insertions in JSON format.`,
    {
      valid_urls: urlContextList,
      content: params.content.slice(0, 4000), // pass substantial body
    }
  );

  let recommendations: InternalLinkRecommendation[] = [];

  try {
    const res = await callGroqWithRetry({
      messages: [
        { role: "system", content: sysPrompt },
        {
          role: "user",
          content: `${renderedUserPrompt}\n\nRespond ONLY with a valid JSON array: [{"url":"...","anchor_text":"...","sentence_context":"..."}]`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      stage: "internal_linking",
      response_format: { type: "json_object" },
    });

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

  // If AI returned fewer than 2 links, use deterministic keyword matching fallback
  if (recommendations.length < 2) {
    recommendations = fallbackLinkDiscovery(params.content, candidatePool, params.currentSlug);
  }

  // Apply links safely into the Markdown content (replace first occurrence of anchor text not already inside markdown link)
  let updatedMarkdown = params.content;
  const appliedUrls = new Set<string>();

  for (const rec of recommendations) {
    if (appliedUrls.has(rec.url)) continue;
    if (!rec.anchor_text || rec.anchor_text.length < 3) continue;

    // Check if URL is already present in markdown
    if (updatedMarkdown.includes(`(${rec.url})`)) {
      appliedUrls.add(rec.url);
      continue;
    }

    // Escape regex chars in anchor text
    const escapedAnchor = rec.anchor_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Ensure anchor text is NOT already inside [...](...) or inside a heading #...
    const linkRegex = new RegExp(`(?<!\\[|#.*)\\b(${escapedAnchor})\\b(?!\\]|\\))`, "i");

    if (linkRegex.test(updatedMarkdown)) {
      updatedMarkdown = updatedMarkdown.replace(linkRegex, `[$1](${rec.url})`);
      appliedUrls.add(rec.url);
    }
  }

  return {
    linkedMarkdown: updatedMarkdown,
    recommendations,
  };
}

function fallbackLinkDiscovery(
  content: string,
  candidatePool: ReelScaleUrlEntity[],
  currentSlug?: string
): InternalLinkRecommendation[] {
  const recommendations: InternalLinkRecommendation[] = [];
  const lowerContent = content.toLowerCase();

  for (const entity of candidatePool) {
    if (currentSlug && (entity.path.includes(currentSlug) || entity.url.includes(currentSlug))) {
      continue;
    }

    for (const kw of entity.keywords) {
      if (kw.length > 5 && lowerContent.includes(kw.toLowerCase())) {
        recommendations.push({
          url: entity.url,
          anchor_text: kw,
          sentence_context: `Contextually references ${entity.title}`,
        });
        break;
      }
    }

    if (recommendations.length >= 4) break;
  }

  return recommendations;
}
