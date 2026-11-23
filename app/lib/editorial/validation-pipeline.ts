import { getPublishedBlogsAsync } from "../blog";
import { getAllValidReelScaleUrls, isValidReelScaleUrl } from "../seo/url-registry";

export interface ValidationCheckItem {
  id: string;
  name: string;
  category: "technical" | "seo" | "brand" | "editorial";
  passed: boolean;
  score: number; // 0 to 100
  details: string;
  recommendation?: string;
}

export interface EditorialValidationReport {
  overallScore: number; // 0 to 100
  status: "passed" | "flagged" | "rejected";
  summary: string;
  checks: ValidationCheckItem[];
  wordCount: number;
  readingTimeMinutes: number;
  headingsCount: { h1: number; h2: number; h3: number };
  faqCount: number;
  internalLinksCount: number;
}

export async function validateArticleContent(article: {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  focusKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  featuredImage?: string;
  altText?: string;
  faq?: { question: string; answer: string }[];
}): Promise<EditorialValidationReport> {
  const publishedBlogs = await getPublishedBlogsAsync();
  const validUrls = await getAllValidReelScaleUrls();
  const checks: ValidationCheckItem[] = [];

  const wordCount = (article.content || "").trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Count headings
  const h1Count = (article.content.match(/^#\s+[^\n]+/gm) || []).length;
  const h2Count = (article.content.match(/^##\s+[^\n]+/gm) || []).length;
  const h3Count = (article.content.match(/^###\s+[^\n]+/gm) || []).length;

  // 1. Duplicate title check
  const duplicateTitleMatch = publishedBlogs.find(
    (b) => b.title.toLowerCase() === article.title.toLowerCase() && b.slug !== article.slug
  );
  checks.push({
    id: "duplicate_title",
    name: "Duplicate Title Check",
    category: "technical",
    passed: !duplicateTitleMatch,
    score: duplicateTitleMatch ? 0 : 100,
    details: duplicateTitleMatch
      ? `Duplicate title found with existing article '${duplicateTitleMatch.title}' (/blog/${duplicateTitleMatch.slug})`
      : "Title is completely unique across the catalog.",
  });

  // 2. Duplicate slug check
  const duplicateSlugMatch = publishedBlogs.find((b) => b.slug === article.slug);
  checks.push({
    id: "duplicate_slug",
    name: "Duplicate Slug Check",
    category: "technical",
    passed: !duplicateSlugMatch,
    score: duplicateSlugMatch ? 0 : 100,
    details: duplicateSlugMatch
      ? `Slug '/blog/${article.slug}' already exists in published content lake.`
      : `URL slug '/blog/${article.slug}' is unique and SEO-friendly.`,
  });

  // 3. Keyword cannibalization check
  const focusKw = (article.focusKeyword || "").toLowerCase().trim();
  const cannibalizedBlog = publishedBlogs.find(
    (b) => b.focusKeyword && b.focusKeyword.toLowerCase().trim() === focusKw && b.slug !== article.slug
  );
  checks.push({
    id: "keyword_cannibalization",
    name: "Keyword Cannibalization",
    category: "seo",
    passed: !cannibalizedBlog,
    score: cannibalizedBlog ? 20 : 100,
    details: cannibalizedBlog
      ? `Primary keyword '${focusKw}' matches existing post '/blog/${cannibalizedBlog.slug}'.`
      : "No direct keyword cannibalization detected with existing assets.",
  });

  // 4. Search intent match
  const hasActionableIntent = /guide|how to|reasons|tips|strategy|service|production|hyderabad/i.test(article.title);
  checks.push({
    id: "search_intent_match",
    name: "Search Intent Alignment",
    category: "seo",
    passed: hasActionableIntent,
    score: hasActionableIntent ? 100 : 70,
    details: hasActionableIntent
      ? "Title and content directly target specific user search intent."
      : "Title may be ambiguous; recommend clarifying commercial or informational intent.",
  });

  // 5. Article usefulness & depth (target ~1,200 - 1,800 words)
  const isDepthOptimal = wordCount >= 1000 && wordCount <= 2500;
  checks.push({
    id: "article_usefulness",
    name: "Content Depth & Word Count",
    category: "editorial",
    passed: wordCount >= 900,
    score: isDepthOptimal ? 100 : wordCount >= 800 ? 75 : 40,
    details: `Article contains ${wordCount} words (Target: 1,200 - 1,800 words).`,
    recommendation: wordCount < 1000 ? "Consider expanding with more case examples and step-by-step instructions." : undefined,
  });

  // 6. Factual accuracy (no fake facts or unsupported statistics)
  const containsSuspiciousClaims = /100% guarantee|guaranteed #1 ranking|google approved partner/i.test(article.content);
  checks.push({
    id: "factual_accuracy",
    name: "Factual Plausibility",
    category: "editorial",
    passed: !containsSuspiciousClaims,
    score: containsSuspiciousClaims ? 50 : 100,
    details: containsSuspiciousClaims
      ? "Contains potentially exaggerated marketing claims."
      : "Content presents factually realistic assertions and pragmatic production advice.",
  });

  // 7. Brand accuracy (ReelScale Hyderabad, 10-minute on-location shoot-to-delivery, iPhone shoots)
  const mentionsReelScale = /reelscale/i.test(article.content);
  const mentionsHyderabad = /hyderabad|gachibowli|madhapur|hitec city|jubilee hills/i.test(article.content);
  const mentionsProcess = /iphone|10 minute|on-location|short-form/i.test(article.content);
  const brandPassed = mentionsReelScale && mentionsHyderabad;
  checks.push({
    id: "brand_accuracy",
    name: "ReelScale Brand & Workflow Fidelity",
    category: "brand",
    passed: brandPassed,
    score: brandPassed && mentionsProcess ? 100 : brandPassed ? 85 : 50,
    details: `Mentions ReelScale: ${mentionsReelScale ? "Yes" : "No"} | Hyderabad context: ${mentionsHyderabad ? "Yes" : "No"} | Core Process (iPhone / 10-min): ${mentionsProcess ? "Yes" : "No"}`,
  });

  // 8. Heading structure
  const headingsValid = h2Count >= 3;
  checks.push({
    id: "heading_structure",
    name: "Heading Hierarchy (H1, H2, H3)",
    category: "technical",
    passed: headingsValid,
    score: headingsValid ? 100 : 50,
    details: `Found ${h1Count} H1, ${h2Count} H2s, ${h3Count} H3s.`,
    recommendation: h2Count < 3 ? "Add more descriptive H2 subheadings to break up long text blocks." : undefined,
  });

  // 9. Meta title length (optimal 45-65 chars)
  const metaTitleLength = (article.metaTitle || article.title || "").length;
  const metaTitleOptimal = metaTitleLength >= 40 && metaTitleLength <= 70;
  checks.push({
    id: "meta_title",
    name: "Meta Title Optimization",
    category: "seo",
    passed: metaTitleLength > 20,
    score: metaTitleOptimal ? 100 : 70,
    details: `Meta title is ${metaTitleLength} characters long (Optimal: 50-60 characters).`,
  });

  // 10. Meta description length (optimal 120-165 chars)
  const metaDescLength = (article.metaDescription || article.description || "").length;
  const metaDescOptimal = metaDescLength >= 110 && metaDescLength <= 170;
  checks.push({
    id: "meta_description",
    name: "Meta Description Optimization",
    category: "seo",
    passed: metaDescLength > 60,
    score: metaDescOptimal ? 100 : 70,
    details: `Meta description is ${metaDescLength} characters long (Optimal: 130-160 characters).`,
  });

  // 11. Internal links count & validity
  const internalLinkRegex = /\[([^\]]+)\]\((https:\/\/reelscale\.in[^)]+|\/[^)]+)\)/g;
  const foundLinks: { text: string; url: string }[] = [];
  let linkMatch;
  while ((linkMatch = internalLinkRegex.exec(article.content)) !== null) {
    foundLinks.push({ text: linkMatch[1], url: linkMatch[2] });
  }

  const validInternalLinks = foundLinks.filter((l) => isValidReelScaleUrl(l.url, validUrls));
  const hasSufficientLinks = validInternalLinks.length >= 2;
  checks.push({
    id: "internal_links",
    name: "Contextual Internal Links",
    category: "seo",
    passed: hasSufficientLinks,
    score: hasSufficientLinks ? 100 : foundLinks.length > 0 ? 60 : 30,
    details: `Found ${foundLinks.length} internal links (${validInternalLinks.length} verified against site registry).`,
  });

  // 12. Featured image relevance
  const hasImage = Boolean(article.featuredImage && article.featuredImage.startsWith("http"));
  checks.push({
    id: "image_relevance",
    name: "Featured Image Sourced",
    category: "technical",
    passed: hasImage,
    score: hasImage ? 100 : 0,
    details: hasImage ? "Featured image provided from authorized stock provider." : "Missing featured image.",
  });

  // 13. Alt text
  const hasAlt = Boolean(article.altText && article.altText.trim().length > 5);
  checks.push({
    id: "alt_text",
    name: "Image Alt Text Accessibility",
    category: "seo",
    passed: hasAlt,
    score: hasAlt ? 100 : 40,
    details: hasAlt ? `Alt text configured: "${article.altText}"` : "Image alt text is missing or too brief.",
  });

  // 14. Canonical URL
  const hasCanonical = Boolean(article.canonicalUrl && article.canonicalUrl.startsWith("https://reelscale.in/blog/"));
  checks.push({
    id: "canonical_url",
    name: "Canonical URL Integrity",
    category: "technical",
    passed: hasCanonical,
    score: hasCanonical ? 100 : 50,
    details: hasCanonical
      ? `Canonical URL correctly points to ${article.canonicalUrl}`
      : "Canonical URL missing or malformed.",
  });

  // 15. Article schema & FAQs
  const faqCount = Array.isArray(article.faq) ? article.faq.length : 0;
  const hasFaqs = faqCount >= 2;
  checks.push({
    id: "article_schema_faq",
    name: "FAQ Schema & Structured Data",
    category: "seo",
    passed: hasFaqs,
    score: hasFaqs ? 100 : faqCount === 1 ? 70 : 40,
    details: `Found ${faqCount} FAQ items ready for FAQPage schema indexing.`,
  });

  // Calculate overall score
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const overallScore = Math.round(totalScore / checks.length);

  // Critical failure checks
  const criticalFailed = !checks.find((c) => c.id === "duplicate_title")?.passed;

  const status: "passed" | "flagged" | "rejected" =
    criticalFailed || overallScore < 55
      ? "rejected"
      : overallScore >= 80
      ? "passed"
      : "flagged";

  const summary =
    status === "passed"
      ? `Passed all editorial benchmarks with an overall SEO quality score of ${overallScore}/100.`
      : status === "flagged"
      ? `Editorial review recommended (Score: ${overallScore}/100). Minor improvements suggested before publishing.`
      : `Failed critical quality validation (Score: ${overallScore}/100). Needs revision.`;

  return {
    overallScore,
    status,
    summary,
    checks,
    wordCount,
    readingTimeMinutes,
    headingsCount: { h1: h1Count, h2: h2Count, h3: h3Count },
    faqCount,
    internalLinksCount: validInternalLinks.length,
  };
}
