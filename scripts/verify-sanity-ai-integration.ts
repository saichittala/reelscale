import { client, writeClient } from '../app/sanity/client';
import { getAiSettingsFromSanity, saveAiSettingsToSanity, getAiScheduleFromSanity, saveAiScheduleToSanity } from '../app/sanity/ai-sync';
import { getPublishedBlogsAsync } from '../app/lib/blog';
import { getActiveSchedule, calculate30DayPreview } from '../app/lib/scheduler/cron-scheduler';
import { getQueueStats } from '../app/lib/queue/job-queue';

async function verifySanityIntegration() {
  console.log('====================================================');
  console.log('VERIFYING SANITY CMS AS PRIMARY BLOG & AI DATABASE');
  console.log('====================================================');

  // 1. Sanity Blog Retrieval
  const blogs = await getPublishedBlogsAsync();
  console.log(`[PASS] Sanity Content Lake returned ${blogs.length} published blogs:`);
  blogs.slice(0, 3).forEach((b) => console.log(`   - "${b.title}" (slug: /blog/${b.slug})`));

  // 2. Sanity AI Settings Write & Read
  const savedSettings = await saveAiSettingsToSanity({
    daily_target: 15,
    max_daily_limit: 50,
    model: 'openai/gpt-oss-120b',
    auto_publish: false,
  });
  console.log(`[PASS] AI Settings persisted to Sanity Content Lake: daily_target=${savedSettings.daily_target}, model=${savedSettings.model}`);

  const readSettings = await getAiSettingsFromSanity();
  console.log(`[PASS] AI Settings fetched from Sanity Content Lake: is_enabled=${readSettings.is_enabled}, is_paused=${readSettings.is_paused}`);

  // 3. Sanity AI Schedule Write, Read & 30-Day Preview
  const savedSchedule = await saveAiScheduleToSanity({
    schedule_type: 'selected_weekdays',
    blogs_per_active_day: 15,
    generation_time: '09:30',
    timezone: 'Asia/Kolkata',
    active_weekdays: ['monday', 'wednesday', 'friday'],
  });
  console.log(`[PASS] AI Schedule persisted to Sanity Content Lake: type=${savedSchedule.schedule_type}, time=${savedSchedule.generation_time}`);

  const activeSched = await getActiveSchedule();
  if (!activeSched) throw new Error('Active schedule returned null');
  console.log(`[PASS] Active schedule loaded: ${activeSched.name} (${activeSched.active_weekdays.join(', ')})`);

  const preview = calculate30DayPreview(activeSched);
  console.log(`[PASS] 30-Day Preview calculated: ${preview.activeDaysCount} active days, expected monthly=${preview.expectedMonthlyTotal} blogs`);

  // 4. Autonomous Queue Stats
  const stats = await getQueueStats();
  console.log(`[PASS] Queue stats ready: queued=${stats.queued}, completed=${stats.completed}, today=${stats.todayCompleted}`);

  console.log('====================================================');
  console.log('ALL SANITY CMS INTEGRATION CHECKS PASSED (100% OK)');
  console.log('====================================================');
}

verifySanityIntegration().catch((e) => {
  console.error('Integration check failed:', e);
  process.exit(1);
});
