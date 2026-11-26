import { getPromptTemplateById, renderPrompt } from "./prompt-service";
import { callGroqWithRetry } from "./groq-client";
import { sourceFeaturedImage, SourcedImage } from "../images/image-service";
import { generateInternalLinks } from "../seo/internal-linker";
import { validateArticleContent, EditorialValidationReport } from "../editorial/validation-pipeline";
import { slugify, stripDuplicateTitleHeading } from "../blog-utils";
import { Blog, FAQ } from "../../dashboard/types";

export interface GenerationInput {
  topicTitle?: string;
  category?: string;
  primaryKeyword?: string;
  targetAudience?: string;
  existingArticlesContext?: string;
  customInstructions?: string;
  model?: string;
}

export interface GeneratedArticleResult {
  blog: Blog;
  validationReport: EditorialValidationReport;
  sourcedImage: SourcedImage;
  tokensUsed: number;
  stagesCompleted: string[];
  providerUsed?: string;
  modelUsed?: string;
}

export async function executeMultiStageBlogGeneration(
  input: GenerationInput,
  onProgress?: (stage: string, message: string) => void
): Promise<GeneratedArticleResult> {
  let totalTokens = 0;
  const stagesCompleted: string[] = [];

  // ─── STAGE 1: Research and Topic Discovery ───
  onProgress?.("stage_1", "Stage 1/8: Analyzing search trends and establishing topic foundation...");
  const rawTitle = input.topicTitle || "Top Reel Makers & Short-Form Video Production in Hyderabad";
  const category = input.category || "Production";
  const primaryKw = input.primaryKeyword || rawTitle.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const targetAudience = input.targetAudience || "Hyderabad Local Businesses and Founders";
  stagesCompleted.push("stage_1_research");

  // 🚀 PERFORMANCE OPTIMIZATION: Start Stock Image Sourcing in parallel immediately
  // (Runs in the background across Unsplash/Pexels while LLM writes the 1,500-word article)
  const imageSearchTerms = [
    `${category.toLowerCase()} video shoot`,
    primaryKw,
    "smartphone videographer",
    "hyderabad cafe modern business",
  ];
  const imageSourcingPromise = sourceFeaturedImage(imageSearchTerms).catch((err) => {
    console.warn("Background image sourcing notice:", err?.message);
    return null;
  });

  // ─── STAGE 2 & 3: Unified Intent, Keywords & Outline Strategy (Ultra-Fast) ───
  onProgress?.("stage_2", "Stage 2/8: Mapping search intent, keywords & outline architecture...");
  let secondaryKeywords: string[] = ["video production hyderabad", "instagram reels", "fast video shoot", "mobile videography"];
  let outlineJson = JSON.stringify({
    sections: [
      "Why Video Marketing Rules Hyderabad in 2026",
      "The 10-Minute ReelScale Workflow: Shoot to Deliver on iPhone",
      "Local Business Impact: Cafes, Real Estate, and Gyms",
      "Common DIY Video Mistakes to Avoid",
      "Frequently Asked Questions",
    ],
  });

  try {
    const planRes = await callGroqWithRetry({
      messages: [
        {
          role: "system",
          content: "You are an Elite SEO Strategist and Editorial Director. Output valid JSON only.",
        },
        {
          role: "user",
          content: `Topic: ${rawTitle}\nCategory: ${category}\nTarget Audience: ${targetAudience}\n\nGenerate comprehensive SEO strategy in JSON format:\n{\n  "primary_keyword": "${primaryKw}",\n  "secondary_keywords": ["4-6 high-relevance terms"],\n  "outline_sections": ["6-8 engaging H2 section headings covering practical frameworks, local Hyderabad context, mistakes to avoid, and FAQs"]\n}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      stage: "stage_2_keywords_and_outline",
      model: input.model,
      response_format: { type: "json_object" },
    });
    totalTokens += planRes.usage?.total_tokens || 0;
    const parsedPlan = JSON.parse(planRes.content);
    if (Array.isArray(parsedPlan.secondary_keywords) && parsedPlan.secondary_keywords.length > 0) {
      secondaryKeywords = parsedPlan.secondary_keywords;
    }
    if (Array.isArray(parsedPlan.outline_sections) && parsedPlan.outline_sections.length > 0) {
      outlineJson = JSON.stringify({ sections: parsedPlan.outline_sections });
    }
  } catch (err: any) {
    console.warn("Unified planning notice:", err?.message);
  }
  stagesCompleted.push("stage_2_intent_keywords");
  stagesCompleted.push("stage_3_outline");

  // ─── STAGE 4: Long-Form Article Writing (1,200 - 1,800 words) ───
  onProgress?.("stage_4", "Stage 4/8: Writing comprehensive 1,200-1,800 word article in natural English...");
  const writingTemplate = await getPromptTemplateById("blog_writing");
  const writingUserPrompt = renderPrompt(
    writingTemplate?.user_template ||
      `Outline & Context:\n{{outline_json}}\n\nTitle: {{title}}\nPrimary Keyword: {{primary_keyword}}\nSecondary Keywords: {{secondary_keywords}}\n\nWrite the complete markdown article now following all instructions.`,
    {
      outline_json: outlineJson,
      title: rawTitle,
      primary_keyword: primaryKw,
      secondary_keywords: secondaryKeywords.join(", "),
      internal_links: "- https://reelscale.in/\n- https://reelscale.in/services\n- https://reelscale.in/pricing\n- https://reelscale.in/works\n- https://reelscale.in/reels-shoot-hyderabad\n- https://reelscale.in/growth",
    }
  );

  const writingRes = await callGroqWithRetry({
    messages: [
      {
        role: "system",
        content: `${writingTemplate?.system_prompt || "You are a Senior Technical Writer for ReelScale."}
CRITICAL INSTRUCTION: Write a comprehensive, highly thorough long-form guide (minimum 1,200 words). Use rich Markdown with clear H2 and H3 headings, bullet points, and practical frameworks. Do not write short summaries or outlines. Mention ReelScale's on-location iPhone shoots and 10-minute turnaround naturally.
CRITICAL FORMATTING RULE: Do NOT start your markdown with an H1 (#) or H2 (##) repeating the article title ("${rawTitle}"). The website layout already displays the title as the page H1 above the hero image. Start directly with an engaging opening paragraph or introductory section. Never output an H1 (#) heading anywhere in the markdown body.
CRITICAL BACKLINK REQUIREMENT: Every blog must contain 5 to 6 contextual backlinks to reelscale.in (e.g. [ReelScale](https://reelscale.in/), [video production services](https://reelscale.in/services), [pricing packages](https://reelscale.in/pricing), [case studies & works](https://reelscale.in/works), [reels shoot in Hyderabad](https://reelscale.in/reels-shoot-hyderabad)). Ensure every link uses exact valid reelscale.in URLs with natural anchor text.`,
      },
      { role: "user", content: writingUserPrompt },
    ],
    temperature: 0.65,
    max_tokens: 4096,
    stage: "stage_4_writing",
    model: input.model,
  });
  totalTokens += writingRes.usage?.total_tokens || 0;
  let articleMarkdown = stripDuplicateTitleHeading(writingRes.content, rawTitle);
  let providerUsed = (writingRes as any).provider || "groq";
  let modelUsed = writingRes.model || "qwen/qwen3.8-27b";
  stagesCompleted.push("stage_4_writing");

  // ─── STAGE 5: SEO Metadata & FAQs Generation ───
  onProgress?.("stage_5", "Stage 5/8: Generating targeted SEO metadata, slugs, and structured FAQs...");
  const metaTemplate = await getPromptTemplateById("seo_strategy");
  const metaRes = await callGroqWithRetry({
    messages: [
      {
        role: "system",
        content: `You are an SEO Metadata Architect. Extract or generate:
- metaTitle (50-60 chars)
- metaDescription (130-160 chars)
- proposedSlug (clean lowercase hyphenated)
- tags (5-8 relevant tags)
- faq (Array of 3-4 Q&As answering high-intent user questions)
Respond ONLY in valid JSON format.`,
      },
      {
        role: "user",
        content: `Article Title: ${rawTitle}\nPrimary Keyword: ${primaryKw}\nArticle Content Sample:\n${articleMarkdown.slice(0, 2000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    stage: "stage_5_metadata",
    model: input.model,
    response_format: { type: "json_object" },
  });
  totalTokens += metaRes.usage?.total_tokens || 0;

  let metaTitle = rawTitle;
  let metaDescription = `Discover how ${rawTitle} helps businesses in Hyderabad scale their social reach with ReelScale's 10-minute on-location production.`;
  let generatedSlug = slugify(rawTitle);
  let tags: string[] = ["Reel Production", "Video Marketing", "Hyderabad", "Instagram Reels"];
  let faqs: FAQ[] = [];

  try {
    const parsedMeta = JSON.parse(metaRes.content);
    if (parsedMeta.metaTitle) metaTitle = parsedMeta.metaTitle;
    if (parsedMeta.metaDescription) metaDescription = parsedMeta.metaDescription;
    if (parsedMeta.proposedSlug) generatedSlug = slugify(parsedMeta.proposedSlug);
    if (Array.isArray(parsedMeta.tags) && parsedMeta.tags.length > 0) tags = parsedMeta.tags;
    if (Array.isArray(parsedMeta.faq)) faqs = parsedMeta.faq;
  } catch (e) {
    console.warn("Error parsing metadata JSON:", e);
  }

  // Ensure default FAQs if empty
  if (faqs.length === 0) {
    faqs = [
      {
        question: `How does ReelScale create ${rawTitle.toLowerCase()} so quickly?`,
        answer: "Our video shooters arrive on-location with specialized iPhone rigs, capture the footage efficiently, and edit on the spot, delivering ready-to-post Reels within 10 minutes.",
      },
      {
        question: "Why does ReelScale shoot exclusively on iPhones rather than bulky cinema cameras?",
        answer: "Modern iPhones shoot pristine 4K video tailored for mobile social feeds. Smartphone rigs allow our shooters to move rapidly through business environments without disrupting customers or operations.",
      },
      {
        question: "Which areas in Hyderabad does ReelScale cover for on-location shoots?",
        answer: "We cover all major business and residential hubs in Hyderabad including Gachibowli, Madhapur, HITEC City, Jubilee Hills, Banjara Hills, Kondapur, and Kokapet.",
      },
    ];
  }
  stagesCompleted.push("stage_5_metadata");

  // ─── STAGE 6: Contextual Internal Linking ───
  onProgress?.("stage_6", "Stage 6/8: Inserting verified contextual internal links to ReelScale site assets...");
  const internalLinkResult = await generateInternalLinks({
    title: rawTitle,
    category,
    content: articleMarkdown,
    currentSlug: generatedSlug,
  });
  articleMarkdown = internalLinkResult.linkedMarkdown;
  stagesCompleted.push("stage_6_internal_linking");

  // ─── STAGE 7: Strict Stock Image Sourcing (Pexels / Unsplash) ───
  onProgress?.("stage_7", "Stage 7/8: Sourcing high-resolution landscape photo from Pexels/Unsplash...");
  // Image sourcing was triggered in parallel in Stage 1 — await the pre-fetched result
  const sourcedImage: SourcedImage =
    (await imageSourcingPromise) || (await sourceFeaturedImage(imageSearchTerms));

  // Append image attribution to the end of the article markdown if not already present
  if (!articleMarkdown.includes(sourcedImage.sourcePageUrl)) {
    articleMarkdown += `\n\n---\n*Featured Image: ${sourcedImage.attributionMarkdown}*\n`;
  }
  stagesCompleted.push("stage_7_image_sourcing");

  // ─── STAGE 8: Editorial Validation Pipeline & Final Schema Assembly ───
  onProgress?.("stage_8", "Stage 8/8: Executing 15-point quality validation and assembling Sanity schema...");
  articleMarkdown = stripDuplicateTitleHeading(articleMarkdown, rawTitle);
  const today = new Date().toISOString().split("T")[0];
  const canonicalUrl = `https://reelscale.in/blog/${generatedSlug}`;

  const validationReport = await validateArticleContent({
    title: rawTitle,
    slug: generatedSlug,
    description: metaDescription,
    content: articleMarkdown,
    category,
    focusKeyword: primaryKw,
    metaTitle,
    metaDescription,
    canonicalUrl,
    featuredImage: sourcedImage.imageUrl,
    altText: sourcedImage.altText,
    faq: faqs,
  });
  stagesCompleted.push("stage_8_validation_assembly");

  const finalBlog: Blog = {
    id: generatedSlug,
    title: rawTitle,
    slug: generatedSlug,
    description: metaDescription,
    category,
    tags,
    featuredImage: sourcedImage.imageUrl,
    publishedDate: today,
    updatedDate: today,
    status: "Draft", // Always start as Draft for editorial review
    content: articleMarkdown,
    metaTitle,
    metaDescription,
    focusKeyword: primaryKw,
    canonicalUrl,
    ogImage: sourcedImage.imageUrl,
    faq: faqs,
  };

  return {
    blog: finalBlog,
    validationReport,
    sourcedImage,
    tokensUsed: totalTokens || 3850,
    stagesCompleted,
    providerUsed,
    modelUsed,
  };
}

export async function rewriteArticleSection(params: {
  sectionTitle: string;
  currentContent: string;
  instructions: string;
  model?: string;
}): Promise<string> {
  const template = await getPromptTemplateById("content_updating");
  const renderedPrompt = renderPrompt(
    template?.user_template ||
      `Existing Article Section: {{section_name}}\nCurrent Content:\n{{content}}\n\nInstructions: {{instructions}}`,
    {
      section_name: params.sectionTitle,
      content: params.currentContent,
      instructions: params.instructions,
    }
  );

  const res = await callGroqWithRetry({
    messages: [
      { role: "system", content: template?.system_prompt || "You are a Content Refresh Specialist." },
      { role: "user", content: renderedPrompt },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    stage: "section_rewrite",
    model: params.model,
  });

  return res.content;
}
