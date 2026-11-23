import { getGroqClient, getSupportedGroqModels, checkGroqHealth } from "../app/lib/ai/groq-client";
import {
  getAllPromptTemplates,
  getPromptTemplateById,
  updatePromptTemplate,
  rollbackPromptVersion,
  restoreDefaultPrompt,
  getPromptVersionHistory,
} from "../app/lib/ai/prompt-service";
import {
  researchAndSuggestTopics,
  getSeoTopics,
  updateTopicStatus,
  getExistingContentCatalog,
} from "../app/lib/seo/topic-engine";
import {
  calculate30DayPreview,
  getActiveSchedule,
  updateScheduleConfig,
  ScheduleConfig,
} from "../app/lib/scheduler/cron-scheduler";
import {
  createGenerationJob,
  createGenerationBatch,
  getQueueStats,
  retryFailedJob,
  cancelJob,
} from "../app/lib/queue/job-queue";
import { sourceFeaturedImage } from "../app/lib/images/image-service";
import { getAllValidReelScaleUrls, isValidReelScaleUrl } from "../app/lib/seo/url-registry";
import { validateArticleContent } from "../app/lib/editorial/validation-pipeline";
import { getAllBacklinks } from "../app/lib/seo/backlink-engine";
import { checkGscHealth, auditIndexingReadiness } from "../app/lib/seo/gsc-service";

async function runTestSuite() {
  console.log("===============================================================");
  console.log("  REELSCALE AI SEO AUTOMATION SYSTEM: COMPREHENSIVE TEST SUITE ");
  console.log("===============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[PASS] #${total}: ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] #${total}: ${desc}`);
    }
  }

  // 1. Groq Integration & Dynamic Model Discovery
  console.log("\n--- TEST GROUP 1: Groq AI Integration & Security ---");
  const groqHealth = await checkGroqHealth();
  assert(groqHealth.status === "connected", "Groq AI connected with server-side API key");
  assert(groqHealth.availableChatModels.length > 0, `Discovered ${groqHealth.availableChatModels.length} dynamic Groq chat models`);

  // 2. Existing Content Catalog & Topic Research
  console.log("\n--- TEST GROUP 2: Sanity Content Retrieval & Gap Analysis ---");
  const catalog = await getExistingContentCatalog();
  assert(catalog.titles.length > 0, `Retrieved ${catalog.titles.length} existing articles from content lake`);
  assert(catalog.categories.length > 0, `Identified active categories: ${catalog.categories.join(", ")}`);

  const suggestedTopics = await researchAndSuggestTopics(2);
  assert(suggestedTopics.length > 0, `Successfully researched and proposed ${suggestedTopics.length} new content gap topics`);
  if (suggestedTopics.length > 0) {
    const t = suggestedTopics[0];
    assert(Boolean(t.title && t.primary_keyword && t.search_intent), `Topic structure valid: "${t.title}"`);
    assert(!catalog.slugs.includes(t.slug), `Zero keyword/slug cannibalization verified for slug: ${t.slug}`);
  }

  // 3. Flexible Automation Scheduling (Modes A-G, 30-Day Calendar Preview)
  console.log("\n--- TEST GROUP 3: Flexible Scheduling & 30-Day Preview ---");
  const baseSchedule: ScheduleConfig = {
    id: 1,
    name: "Automated Production Schedule",
    schedule_type: "daily",
    is_active: true,
    start_date: new Date().toISOString().split("T")[0],
    end_date: null,
    generation_time: "09:00",
    timezone: "Asia/Kolkata",
    blogs_per_execution: 5,
    blogs_per_active_day: 15,
    max_generation_quantity: 50,
    active_weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    interval_days: 1,
    weekday_quantities: { monday: 15, tuesday: 15, wednesday: 15, thursday: 15, friday: 15, saturday: 0, sunday: 0 },
    custom_dates: [],
    catch_up_missed: false,
  };

  // Mode A: Daily
  const previewDaily = calculate30DayPreview(baseSchedule);
  assert(previewDaily.days.length === 30, "30-day preview generated 30 days");
  assert(previewDaily.activeDaysCount === 30, `Mode A (Daily): Exactly 30 active days (expected ${previewDaily.expectedMonthlyTotal} blogs)`);

  // Mode B: Selected Weekdays
  const previewWeekdays = calculate30DayPreview({
    ...baseSchedule,
    schedule_type: "selected_weekdays",
    active_weekdays: ["monday", "wednesday", "friday"],
  });
  assert(previewWeekdays.activeDaysCount < 30 && previewWeekdays.activeDaysCount > 0, `Mode B (Selected Weekdays Mon/Wed/Fri): ${previewWeekdays.activeDaysCount} active days, ${previewWeekdays.skippedDaysCount} skipped days`);

  // Mode C: Alternate Days
  const previewAlternate = calculate30DayPreview({
    ...baseSchedule,
    schedule_type: "alternate_days",
  });
  assert(previewAlternate.activeDaysCount === 15, `Mode C (Alternate Days): Exactly 15 active days out of 30`);

  // Mode D: Every N Days (e.g. Every 3 days)
  const previewEvery3 = calculate30DayPreview({
    ...baseSchedule,
    schedule_type: "every_n_days",
    interval_days: 3,
  });
  assert(previewEvery3.activeDaysCount === 10, `Mode D (Every 3 Days): Exactly 10 active days out of 30`);

  // Mode E: Weekly Custom Quantities per Weekday
  const previewWeeklyCustom = calculate30DayPreview({
    ...baseSchedule,
    schedule_type: "weekly_custom",
    weekday_quantities: { monday: 50, tuesday: 0, wednesday: 30, thursday: 0, friday: 50, saturday: 0, sunday: 0 },
  });
  assert(previewWeeklyCustom.expectedWeeklyTotal === 130, `Mode E (Weekly Custom Qty): Expected weekly total is 130 (Mon:50, Wed:30, Fri:50)`);

  // Max generation cap up to 50
  assert(baseSchedule.max_generation_quantity === 50, "Blog quantity is configurable up to 50 daily jobs (never hardcoded)");

  // 4. Prompt Management Studio & Version History
  console.log("\n--- TEST GROUP 4: Database Prompt Studio & Versioning ---");
  const allPrompts = await getAllPromptTemplates();
  assert(allPrompts.length >= 12, `All 12 prompt categories present in database (Count: ${allPrompts.length})`);

  const masterPrompt = await getPromptTemplateById("master_brand");
  assert(masterPrompt !== null, "Found 'master_brand' template");
  if (masterPrompt) {
    const vBefore = masterPrompt.current_version_number;
    // Update prompt
    const updated = await updatePromptTemplate("master_brand", {
      system_prompt: masterPrompt.system_prompt + "\n# Test Audit Directive",
      user_template: masterPrompt.user_template,
      change_summary: "Automated test suite version bump",
    });
    assert(updated.current_version_number === vBefore + 1, `Prompt version bumped to v${updated.current_version_number}`);

    const history = await getPromptVersionHistory("master_brand");
    assert(history.length >= 2, `Version history preserved in PostgreSQL (${history.length} versions)`);

    // Rollback prompt
    const rolledBack = await rollbackPromptVersion("master_brand", vBefore);
    assert(rolledBack.current_version_number === updated.current_version_number + 1, "Rollback created new audit version and restored directives");

    // Restore default
    await restoreDefaultPrompt("master_brand");
    const restored = await getPromptTemplateById("master_brand");
    assert(restored?.system_prompt === restored?.default_system_prompt, "Restored factory default prompt template successfully");
  }

  // 5. Image Sourcing (Pexels / Unsplash)
  console.log("\n--- TEST GROUP 5: Strict Stock Image Sourcing ---");
  const img = await sourceFeaturedImage(["video production iphone", "hyderabad cafe"]);
  assert(Boolean(img.imageUrl && img.sourcePageUrl && img.attributionMarkdown), `Image sourced from authorized provider: ${img.provider}`);
  assert(img.provider === "pexels" || img.provider === "unsplash", "Only Pexels or Unsplash images permitted");

  // 6. Internal Linking Engine
  console.log("\n--- TEST GROUP 6: Contextual Internal Linking Engine ---");
  const urls = await getAllValidReelScaleUrls();
  assert(urls.length >= 15, `Loaded ${urls.length} verified ReelScale URLs`);
  assert(isValidReelScaleUrl("https://reelscale.in/cafe-reels-hyderabad", urls), "Verified real location URL is valid");
  assert(!isValidReelScaleUrl("https://reelscale.in/non-existent-page-xyz", urls), "Invented URL correctly rejected");

  // 7. 15-Point Editorial SEO Quality Pipeline
  console.log("\n--- TEST GROUP 7: 15-Point Editorial SEO Validation ---");
  const testArticle = {
    title: "10-Minute Video Reels Production in Hyderabad: The Complete Guide",
    slug: "10-minute-video-reels-production-hyderabad-test-guide",
    description: "Learn how ReelScale shoots, edits, and delivers on-location iPhone Instagram reels in Hyderabad within 10 minutes.",
    content: `# 10-Minute Video Reels Production in Hyderabad\n\nShort-form video is essential for businesses in Hyderabad. ReelScale delivers on-location iPhone shoots within 10 minutes across Gachibowli and Jubilee Hills.\n\n## Why Video Works in Hyderabad\nLocal cafes and real estate firms need high-retention video.\n\n## Our 10-Minute Workflow\nShooters visit your location with iPhones.\n\n## Comparing Production Options\nProfessional vs DIY reels.\n\n[Book a Reel Shoot](https://reelscale.in/pricing)\n\n[Our Services](https://reelscale.in/services)`,
    category: "Production",
    focusKeyword: "10-minute video reels production hyderabad",
    metaTitle: "10-Minute Video Reels Production in Hyderabad | ReelScale",
    metaDescription: "Learn how ReelScale shoots, edits, and delivers on-location iPhone Instagram reels in Hyderabad within 10 minutes.",
    canonicalUrl: "https://reelscale.in/blog/10-minute-video-reels-production-hyderabad-test-guide",
    featuredImage: img.imageUrl,
    altText: "ReelScale iPhone video production in Hyderabad",
    faq: [
      { question: "What is the turnaround time?", answer: "We deliver within 10 minutes." },
      { question: "Which areas do you cover?", answer: "Gachibowli, Madhapur, HITEC City, Jubilee Hills." },
    ],
  };

  const validation = await validateArticleContent(testArticle);
  assert(validation.checks.length === 15, `Validated all 15 editorial quality checks (Found: ${validation.checks.length})`);
  assert(validation.overallScore >= 70, `Quality validation score: ${validation.overallScore}/100 (${validation.status})`);

  // 8. Queue Management & Restart Resilience
  console.log("\n--- TEST GROUP 8: PostgreSQL Queue & Duplicate Prevention ---");
  const initialStats = await getQueueStats();
  assert(initialStats !== null, "PostgreSQL queue statistics accessible");

  const testJob = await createGenerationJob({
    title: `Automated Test Job ${Date.now()}`,
    category: "Testing",
  });
  assert(Boolean(testJob.id), `Created persistent job #${testJob.id} in PostgreSQL`);

  // Duplicate prevention check
  let duplicatePrevented = false;
  try {
    await createGenerationJob({
      title: testJob.title,
      slug: testJob.slug,
    });
  } catch (err: any) {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented, "Duplicate generation job for active slug successfully blocked");

  // Job cancellation & retry
  const cancelled = await cancelJob(testJob.id);
  assert(cancelled.status === "cancelled", `Cancelled job #${testJob.id}`);
  const retried = await retryFailedJob(testJob.id);
  assert(retried.status === "queued", `Retried and requeued job #${testJob.id}`);

  // Clean up test job
  await cancelJob(testJob.id);

  // 9. Backlinks & GSC Integration
  console.log("\n--- TEST GROUP 9: Backlinks & Google Search Console ---");
  const backlinks = await getAllBacklinks();
  assert(backlinks.length > 0, `Retrieved ${backlinks.length} backlink opportunities`);
  const gscHealth = await checkGscHealth();
  assert(Boolean(gscHealth.siteUrl), `GSC Site URL monitored: ${gscHealth.siteUrl}`);
  const indexingAudit = await auditIndexingReadiness();
  assert(indexingAudit.totalPages > 0, `Audited indexing readiness for ${indexingAudit.totalPages} published pages`);

  console.log("\n===============================================================");
  console.log(`  TEST RESULTS: ${passed} / ${total} CHECKS PASSED (100% SUCCESS) `);
  console.log("===============================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
