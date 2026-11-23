const { neon } = require('@neondatabase/serverless');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_rv6Kg5InXGNL@ep-dry-forest-b3wk5pmu-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('--- Starting ReelScale AI SEO Automation Schema Migration ---');

  // Helper to run query safely
  async function runCmd(cmd, desc) {
    await sql.query(cmd);
    if (desc) console.log('✓ ' + desc);
  }

  // 1. Settings Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_automation_settings (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(50) NOT NULL DEFAULT 'groq',
      model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-oss-120b',
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      is_paused BOOLEAN NOT NULL DEFAULT FALSE,
      daily_target INTEGER NOT NULL DEFAULT 10,
      max_daily_limit INTEGER NOT NULL DEFAULT 50,
      auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
      min_word_count INTEGER NOT NULL DEFAULT 1200,
      max_word_count INTEGER NOT NULL DEFAULT 1800,
      groq_api_key TEXT,
      gemini_api_key TEXT,
      openrouter_api_key TEXT,
      pexels_api_key TEXT,
      unsplash_access_key TEXT,
      gsc_site_url VARCHAR(255) DEFAULT 'https://reelscale.in',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_automation_settings table ready');

  // Insert default settings if empty
  const existingSettings = await sql.query('SELECT id FROM ai_automation_settings LIMIT 1;');
  if (existingSettings.length === 0) {
    await runCmd(`
      INSERT INTO ai_automation_settings (
        provider, model, is_enabled, is_paused, daily_target, max_daily_limit, auto_publish, gsc_site_url
      ) VALUES (
        'groq', 'openai/gpt-oss-120b', TRUE, FALSE, 10, 50, FALSE, 'https://reelscale.in'
      );
    `, 'Initialized default ai_automation_settings');
  }

  // 2. Schedule Configs Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_schedule_configs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      schedule_type VARCHAR(50) NOT NULL DEFAULT 'daily',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE,
      generation_time VARCHAR(10) NOT NULL DEFAULT '09:00',
      timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
      blogs_per_execution INTEGER NOT NULL DEFAULT 5,
      blogs_per_active_day INTEGER NOT NULL DEFAULT 10,
      max_generation_quantity INTEGER NOT NULL DEFAULT 50,
      active_weekdays JSONB NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
      interval_days INTEGER NOT NULL DEFAULT 1,
      weekday_quantities JSONB NOT NULL DEFAULT '{"monday":10,"tuesday":10,"wednesday":10,"thursday":10,"friday":10,"saturday":0,"sunday":0}'::jsonb,
      custom_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
      catch_up_missed BOOLEAN NOT NULL DEFAULT FALSE,
      last_run_at TIMESTAMPTZ,
      next_run_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_schedule_configs table ready');

  // Insert default schedule if empty
  const existingSchedules = await sql.query('SELECT id FROM ai_schedule_configs LIMIT 1;');
  if (existingSchedules.length === 0) {
    await runCmd(`
      INSERT INTO ai_schedule_configs (
        name, schedule_type, is_active, generation_time, timezone,
        blogs_per_execution, blogs_per_active_day, max_generation_quantity,
        active_weekdays, interval_days, weekday_quantities
      ) VALUES (
        'Primary Business Days Schedule', 'selected_weekdays', TRUE, '09:00', 'Asia/Kolkata',
        5, 10, 50,
        '["monday","tuesday","wednesday","thursday","friday"]'::jsonb, 1,
        '{"monday":10,"tuesday":10,"wednesday":10,"thursday":10,"friday":10,"saturday":0,"sunday":0}'::jsonb
      );
    `, 'Initialized default ai_schedule_configs');
  }

  // 3. Prompt Templates Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_prompt_templates (
      id VARCHAR(50) PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      current_version_number INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      system_prompt TEXT NOT NULL,
      user_template TEXT NOT NULL,
      default_system_prompt TEXT NOT NULL,
      default_user_template TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_prompt_templates table ready');

  // 4. Prompt Versions Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_prompt_versions (
      id SERIAL PRIMARY KEY,
      template_id VARCHAR(50) NOT NULL REFERENCES ai_prompt_templates(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      system_prompt TEXT NOT NULL,
      user_template TEXT NOT NULL,
      change_summary TEXT,
      updated_by VARCHAR(100) DEFAULT 'Admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_prompt_versions table ready');
  await runCmd(`
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_template ON ai_prompt_versions(template_id, version_number DESC);
  `);

  // 5. Generation Batches Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_generation_batches (
      id VARCHAR(64) PRIMARY KEY,
      schedule_id INTEGER REFERENCES ai_schedule_configs(id) ON DELETE SET NULL,
      batch_name VARCHAR(150) NOT NULL,
      total_jobs INTEGER NOT NULL DEFAULT 0,
      completed_jobs INTEGER NOT NULL DEFAULT 0,
      failed_jobs INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_generation_batches table ready');
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_batches_status ON ai_generation_batches(status);`);

  // 6. Topics Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS seo_topics (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      primary_keyword VARCHAR(150) NOT NULL,
      secondary_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
      search_intent VARCHAR(50) NOT NULL DEFAULT 'Informational',
      target_audience VARCHAR(150) NOT NULL DEFAULT 'Local Businesses in Hyderabad',
      category VARCHAR(100) NOT NULL DEFAULT 'Production',
      business_relevance TEXT,
      content_priority VARCHAR(20) NOT NULL DEFAULT 'High',
      status VARCHAR(50) NOT NULL DEFAULT 'suggested',
      existing_related_articles JSONB NOT NULL DEFAULT '[]'::jsonb,
      reason_for_creation TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'seo_topics table ready');
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_topics_status ON seo_topics(status);`);
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_topics_slug ON seo_topics(slug);`);

  // 7. Generation Jobs Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_generation_jobs (
      id VARCHAR(64) PRIMARY KEY,
      batch_id VARCHAR(64) REFERENCES ai_generation_batches(id) ON DELETE SET NULL,
      topic_id INTEGER REFERENCES seo_topics(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Video Production',
      status VARCHAR(50) NOT NULL DEFAULT 'queued',
      priority INTEGER NOT NULL DEFAULT 1,
      stage VARCHAR(50) NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      error_message TEXT,
      article_data JSONB,
      sanity_document_id VARCHAR(100),
      validation_results JSONB,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      execution_time_ms INTEGER NOT NULL DEFAULT 0,
      scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_generation_jobs table ready');
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_jobs_status_sched ON ai_generation_jobs(status, scheduled_for ASC);`);
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_jobs_batch ON ai_generation_jobs(batch_id);`);
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_jobs_slug ON ai_generation_jobs(slug);`);

  // 8. Backlink Opportunities Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS backlink_opportunities (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(200) NOT NULL,
      website_url TEXT NOT NULL,
      target_reelscale_url TEXT NOT NULL DEFAULT 'https://reelscale.in',
      relevance_score INTEGER NOT NULL DEFAULT 85,
      suggested_anchor_text VARCHAR(200),
      opportunity_type VARCHAR(100) NOT NULL DEFAULT 'Editorial Mention',
      contact_name VARCHAR(100),
      contact_email VARCHAR(150),
      outreach_status VARCHAR(50) NOT NULL DEFAULT 'Identified',
      outreach_email_draft TEXT,
      verified_backlink_status BOOLEAN NOT NULL DEFAULT FALSE,
      date_acquired DATE,
      follow_up_date DATE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'backlink_opportunities table ready');
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_backlinks_status ON backlink_opportunities(outreach_status);`);

  // 9. Provider Usage Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_provider_usage (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(50) NOT NULL DEFAULT 'groq',
      model VARCHAR(100) NOT NULL,
      stage VARCHAR(50) NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'success',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_provider_usage table ready');
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_usage_created ON ai_provider_usage(created_at DESC);`);

  // 10. Execution History / Logs Table
  await runCmd(`
    CREATE TABLE IF NOT EXISTS ai_execution_history (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(64),
      event_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      message TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `, 'ai_execution_history table ready');
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_exec_history_created ON ai_execution_history(created_at DESC);`);
  await runCmd(`CREATE INDEX IF NOT EXISTS idx_exec_history_job ON ai_execution_history(job_id);`);

  // Seed default 12 prompt templates if missing
  const defaultPrompts = [
    {
      id: 'master_brand',
      category: 'Master Brand Prompt',
      name: 'Master Brand & Tone of Voice',
      description: 'Defines ReelScale identity, 10-minute on-location shoot-to-delivery promise, iPhone production, and Hyderabad business focus.',
      system_prompt: `You are the Lead Brand Strategist and Technical SEO Director for ReelScale (https://reelscale.in), Hyderabad's premier short-form video production company.
Core Brand Positioning: "SHOOT. EDIT. DELIVER. WITHIN 10 MINUTES."
Workflow: ReelScale video shooters visit on-location at client businesses (restaurants, real estate, gyms, interior designers, salons, corporate founders), shoot cinematic content exclusively using iPhones, edit on-location, and deliver ready-to-post Instagram Reels within 10 minutes.
Key Hyderabad Areas: Gachibowli, Madhapur, HITEC City, Jubilee Hills, Banjara Hills, Kondapur, Kokapet, Kukatpally.
Tone: Authoritative, pragmatic, high-velocity, conversion-oriented, deeply knowledgeable about Instagram algorithms and local SEO.
Rules: Never invent fake reviews or unsupported claims. Maintain genuine commercial realism.`,
      user_template: `Review and align the following content request with ReelScale brand principles and Hyderabad market context: {{input}}`,
    },
    {
      id: 'topic_research',
      category: 'Topic Research Prompt',
      name: 'Content Gap & Topical Authority Research',
      description: 'Discovers high-intent commercial and informational blog topics comparing against existing published articles to prevent cannibalization.',
      system_prompt: `You are an SEO Content Strategist. Your mission is to find high-performing short-form video and local marketing topics for ReelScale Hyderabad that have zero keyword cannibalization with existing content.
Output valid JSON only with proposed topics containing: title, primary_keyword, secondary_keywords, search_intent, target_audience, category, business_relevance, proposed_slug, content_priority, reason_for_creation.`,
      user_template: `Existing Published & Draft Titles/Slugs:
{{existing_articles}}

Analyze these existing assets, find untargeted search intents in Hyderabad and short-form video marketing, and propose {{target_count}} unique, high-priority blog topics in valid JSON format.`,
    },
    {
      id: 'keyword_research',
      category: 'Keyword Research Prompt',
      name: 'Search Intent & Keyword Strategy',
      description: 'Maps primary, secondary, semantic LSI, and local geo-targeted keywords for high organic CTR.',
      system_prompt: `You are a Technical Keyword Research Specialist. Generate precise search intent categorization and semantic keyword clusters for a target topic.`,
      user_template: `Topic: {{title}}
Category: {{category}}
Target Audience: {{target_audience}}

Generate comprehensive keyword strategy in JSON format: primary keyword, 4-6 high-relevance secondary keywords, long-tail variations, and localized Hyderabad terms where applicable.`,
    },
    {
      id: 'seo_strategy',
      category: 'SEO Strategy Prompt',
      name: 'Search Strategy & Entity Mapping',
      description: 'Generates structured entity mapping, search engine snippet targets, and search intent alignment.',
      system_prompt: `You are a Search Intent Architect. Map semantic entities, question queries (People Also Ask), and E-E-A-T trust signals for organic search dominance.`,
      user_template: `Topic: {{title}}
Keywords: {{keywords}}

Define target entities, structured data needs (Article, FAQPage, LocalBusiness), and 3-5 core search queries this article must definitively answer.`,
    },
    {
      id: 'article_outline',
      category: 'Article Outline Prompt',
      name: 'Article Outline & Heading Hierarchy',
      description: 'Generates logically structured H2 and H3 headings engineered for reader retention and Google Featured Snippets.',
      system_prompt: `You are an Editorial Director. Create comprehensive, retention-engineered article outlines with clear H2 and H3 hierarchies. Ensure actionable frameworks, real business scenarios, and dedicated FAQ structure. Output JSON outline format.`,
      user_template: `Title: {{title}}
Primary Keyword: {{primary_keyword}}
Secondary Keywords: {{secondary_keywords}}
Target Audience: {{target_audience}}

Generate a detailed 6 to 9 section outline including introduction hook, core technical breakdown, Hyderabad case application, common mistakes, FAQ section, and conclusion CTA.`,
    },
    {
      id: 'blog_writing',
      category: 'Blog Writing Prompt',
      name: 'Long-Form Article Generation',
      description: 'Writes 1,200 to 1,800 word comprehensive, natural English articles with zero AI fluff or keyword stuffing.',
      system_prompt: `You are a Senior Technical Writer and Video Production Expert writing for ReelScale.
Target length: 1,200 - 1,800 words.
Writing Guidelines:
- Natural, professional, compelling English.
- Eliminate generic filler introductions like "In today's fast-paced digital world...". Jump straight into the business problem and tangible value.
- Clear H2 and H3 markdown headings.
- Realistic Hyderabad examples (e.g., Jubilee Hills cafes, Gachibowli tech founders, Madhapur interior studios).
- Accurate ReelScale representation: On-location iPhone shooting, 10-minute shoot-to-delivery workflow.
- High value actionable advice, comparison tables, step-by-step checklists.
- Natural keyword integration without stuffing.`,
      user_template: `Outline & Context:
{{outline_json}}

Title: {{title}}
Primary Keyword: {{primary_keyword}}
Secondary Keywords: {{secondary_keywords}}
Internal Links Available:
{{internal_links}}

Write the complete markdown article now following all instructions.`,
    },
    {
      id: 'seo_validation',
      category: 'SEO Validation Prompt',
      name: 'SEO Quality & Editorial Validation',
      description: 'Audits generated content against 15 technical SEO, brand fidelity, and readability benchmarks.',
      system_prompt: `You are an automated SEO Quality Assurance Engine. Evaluate the drafted article and output a strict JSON scorecard with pass/fail and numeric score (0-100) for:
1. Title optimization
2. Slug validity
3. Keyword cannibalization check
4. Search intent alignment
5. Content depth & utility
6. Brand accuracy (ReelScale 10-minute iPhone model)
7. Heading hierarchy (H2, H3)
8. Meta description quality
9. Internal link context
10. Image placement suggestions
11. Alt text accuracy
12. FAQ schema suitability
13. Readability score
14. Factual plausibility
15. Commercial CTA relevance`,
      user_template: `Article to validate:
Title: {{title}}
Slug: {{slug}}
Content:
{{content}}`,
    },
    {
      id: 'content_originality',
      category: 'Content Originality Prompt',
      name: 'Content Originality & AI Cliché Elimination',
      description: 'Detects and rewrites repetitive AI phrases, generic introductions, and passive constructions into active voice.',
      system_prompt: `You are an Expert Copy Editor. Identify and strip out robotic AI phrasing (e.g. "delve", "testament", "tapestry", "game changer", "in conclusion"). Make the writing snappy, direct, conversational, and authoritative.`,
      user_template: `Review and refine this section for absolute originality and natural human cadence:
{{section_text}}`,
    },
    {
      id: 'internal_linking',
      category: 'Internal Linking Prompt',
      name: 'Contextual Internal Linking Engine',
      description: 'Maps real existing ReelScale service pages and published blogs into the article with natural contextual anchor text.',
      system_prompt: `You are an Internal Linking Specialist. Given a curated list of REAL ReelScale URLs, recommend exact in-text anchor texts and placement locations. Never invent non-existent URLs.`,
      user_template: `Available Valid URLs:
{{valid_urls}}

Article Content:
{{content}}

Identify 3-6 natural anchor text insertion points in the article matching the available URLs. Return JSON array with { url, anchor_text, sentence_context }.`,
    },
    {
      id: 'image_search',
      category: 'Image Search Prompt',
      name: 'Pexels & Unsplash Image Query Optimizer',
      description: 'Extracts photographic, landscape-oriented stock photo search queries for Pexels and Unsplash APIs.',
      system_prompt: `You are a Visual Director. Extract 2-3 precise photographic search queries to find high quality, professional landscape photos on Pexels and Unsplash matching the article topic. Avoid abstract terms; use tangible visual objects (e.g. "smartphone videographer camera lighting", "modern cafe interior hyderabad").`,
      user_template: `Article Title: {{title}}
Category: {{category}}
Primary Keyword: {{primary_keyword}}

Generate 3 clean stock photo search queries and suggested alt text descriptions in JSON format.`,
    },
    {
      id: 'backlink_research',
      category: 'Backlink Research Prompt',
      name: 'Backlink Opportunity & Outreach Drafter',
      description: 'Identifies legitimate high-authority industry publications, local Hyderabad directories, and drafts personalized editorial outreach.',
      system_prompt: `You are an Ethical PR & Link Building Strategist. Identify genuine content partnership, guest contribution, and resource mention opportunities for ReelScale. Never suggest spam links, PBNs, or comment spam. Draft professional, personalized outreach emails.`,
      user_template: `Article Topic: {{title}}
Target Category: {{category}}
ReelScale Positioning: On-location 10-minute short-form video creation in Hyderabad.

Generate 3 relevant publication types/domains in India/Hyderabad and a personalized, value-first pitch email draft in JSON format.`,
    },
    {
      id: 'content_updating',
      category: 'Content Updating Prompt',
      name: 'Content Refresh & Section Regeneration',
      description: 'Analyzes existing published articles and rewrites outdated sections with fresh statistics, trends, and updated links.',
      system_prompt: `You are a Content Refresh Specialist. Update older articles to improve search ranking, add fresh 2026 short-form video algorithms data, and enhance SEO performance while preserving existing URL slugs.`,
      user_template: `Existing Article:
Title: {{title}}
Current Content:
{{content}}

Section to update/expand: {{section_name}}
Instructions: {{instructions}}`,
    },
  ];

  for (const t of defaultPrompts) {
    const existing = await sql.query('SELECT id FROM ai_prompt_templates WHERE id = $1;', [t.id]);
    if (existing.length === 0) {
      await sql.query(
        `INSERT INTO ai_prompt_templates (
          id, category, name, description, current_version_number, is_active,
          system_prompt, user_template, default_system_prompt, default_user_template
        ) VALUES ($1, $2, $3, $4, 1, TRUE, $5, $6, $5, $6);`,
        [t.id, t.category, t.name, t.description, t.system_prompt, t.user_template]
      );
      await sql.query(
        `INSERT INTO ai_prompt_versions (
          template_id, version_number, system_prompt, user_template, change_summary, updated_by
        ) VALUES ($1, 1, $2, $3, 'Initial system default template', 'System');`,
        [t.id, t.system_prompt, t.user_template]
      );
      console.log('✓ Seeded prompt template: ' + t.id);
    }
  }

  // Seed sample backlink opportunities for ReelScale in Hyderabad
  const existingBacklinks = await sql.query('SELECT id FROM backlink_opportunities LIMIT 1;');
  if (existingBacklinks.length === 0) {
    await runCmd(`
      INSERT INTO backlink_opportunities (
        domain, website_url, target_reelscale_url, relevance_score, suggested_anchor_text,
        opportunity_type, contact_name, contact_email, outreach_status, outreach_email_draft,
        notes
      ) VALUES
      (
        'hyderabadstartup.in', 'https://hyderabadstartup.in/resources/marketing-tools', 'https://reelscale.in', 92,
        'fastest video production company in Hyderabad', 'Resource Page Mention', 'Editorial Team', 'editor@hyderabadstartup.in',
        'Identified', 'Hi HyderabadStartup Team,\n\nI noticed your curated list of marketing resources for local founders. ReelScale operates a 10-minute on-location shoot-and-edit model right here in HITEC City and Gachibowli. We would love to be included as a local video production resource.',
        'Top local startup portal with high domain authority in Telangana.'
      ),
      (
        'telanganatoday.com', 'https://telanganatoday.com/business-spotlight', 'https://reelscale.in/reel-production-company-hyderabad', 88,
        'ReelScale video production in Hyderabad', 'Editorial Feature', 'Business Bureau', 'features@telanganatoday.com',
        'Drafted', 'Hello Telangana Today Business Desk,\n\nSharing a story idea on how Hyderabad restaurants and retail stores in Jubilee Hills and Madhapur are leveraging ultra-fast 10-minute mobile video production to stop the Instagram scroll.',
        'Premier Telangana state business news publisher.'
      ),
      (
        'yourstory.com', 'https://yourstory.com/smbstory', 'https://reelscale.in', 85,
        'mobile-first video agency', 'Founder Story / SMB Case Study', 'SMB Desk', 'smbstory@yourstory.com',
        'Identified', 'Pitching ReelScale innovation: moving away from slow 3-week studio video cycles to 10-minute shoot-to-delivery on iPhones.',
        'High authority national tech & startup story platform.'
      );
    `, 'Seeded initial backlink opportunities');
  }

  console.log('--- ReelScale AI SEO Schema Migration Complete Successfully ---');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
