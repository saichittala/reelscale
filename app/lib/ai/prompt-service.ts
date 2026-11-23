import { getDb } from "../db";
import { callGroqWithRetry } from "./groq-client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PROMPTS_FILE = join(process.cwd(), "content", "ai-prompts.json");

function getLocalPrompts(): PromptTemplate[] {
  if (existsSync(PROMPTS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROMPTS_FILE, "utf8"));
    } catch {}
  }
  return [];
}

function saveLocalPrompts(prompts: PromptTemplate[]) {
  try {
    writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2), "utf8");
  } catch {}
}

export interface PromptTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  current_version_number: number;
  is_active: boolean;
  system_prompt: string;
  user_template: string;
  default_system_prompt: string;
  default_user_template: string;
  created_at?: string;
  updated_at?: string;
}

export interface PromptVersion {
  id: number;
  template_id: string;
  version_number: number;
  system_prompt: string;
  user_template: string;
  change_summary?: string;
  updated_by?: string;
  created_at: string;
}

export async function getAllPromptTemplates(): Promise<PromptTemplate[]> {
  try {
    const sql = getDb();
    const rows = await sql.query(`
      SELECT * FROM ai_prompt_templates ORDER BY id ASC;
    `);
    if (rows.length > 0) return rows as PromptTemplate[];
  } catch {}
  return getLocalPrompts();
}

export async function getPromptTemplateById(id: string): Promise<PromptTemplate | null> {
  try {
    const sql = getDb();
    const rows = await sql.query(
      `SELECT * FROM ai_prompt_templates WHERE id = $1 LIMIT 1;`,
      [id]
    );
    if (rows.length > 0) return rows[0] as PromptTemplate;
  } catch {}
  const local = getLocalPrompts();
  return local.find((p) => p.id === id) || null;
}

export async function updatePromptTemplate(
  id: string,
  data: {
    system_prompt: string;
    user_template: string;
    change_summary?: string;
    updated_by?: string;
  }
): Promise<PromptTemplate> {
  const current = await getPromptTemplateById(id);
  if (!current) {
    throw new Error(`Prompt template with ID '${id}' not found`);
  }

  const nextVersion = (current.current_version_number || 1) + 1;
  const updatedObj: PromptTemplate = {
    ...current,
    system_prompt: data.system_prompt,
    user_template: data.user_template,
    current_version_number: nextVersion,
    updated_at: new Date().toISOString(),
  };

  // 1. Update local resilient store
  const local = getLocalPrompts();
  const idx = local.findIndex((p) => p.id === id);
  if (idx >= 0) local[idx] = updatedObj;
  else local.push(updatedObj);
  saveLocalPrompts(local);

  // 2. Optional sync to Neon if configured
  try {
    const sql = getDb();
    await sql.query(
      `INSERT INTO ai_prompt_versions (
        template_id, version_number, system_prompt, user_template, change_summary, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        id,
        nextVersion,
        data.system_prompt,
        data.user_template,
        data.change_summary || "Updated via Prompt Management Studio",
        data.updated_by || "Admin",
      ]
    );

    const updated = await sql.query(
      `UPDATE ai_prompt_templates
       SET system_prompt = $1,
           user_template = $2,
           current_version_number = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *;`,
      [data.system_prompt, data.user_template, nextVersion, id]
    );
    if (updated.length > 0) return updated[0] as PromptTemplate;
  } catch {}

  return updatedObj;
}

export async function getPromptVersionHistory(templateId: string): Promise<PromptVersion[]> {
  const sql = getDb();
  const rows = await sql.query(
    `SELECT * FROM ai_prompt_versions WHERE template_id = $1 ORDER BY version_number DESC;`,
    [templateId]
  );
  return rows as PromptVersion[];
}

export async function rollbackPromptVersion(
  templateId: string,
  targetVersionNumber: number,
  updatedBy = "Admin"
): Promise<PromptTemplate> {
  const sql = getDb();
  const rows = await sql.query(
    `SELECT * FROM ai_prompt_versions WHERE template_id = $1 AND version_number = $2 LIMIT 1;`,
    [templateId, targetVersionNumber]
  );
  if (rows.length === 0) {
    throw new Error(`Version ${targetVersionNumber} not found for template ${templateId}`);
  }

  const targetVersion = rows[0] as PromptVersion;
  return updatePromptTemplate(templateId, {
    system_prompt: targetVersion.system_prompt,
    user_template: targetVersion.user_template,
    change_summary: `Rollback to version ${targetVersionNumber}`,
    updated_by: updatedBy,
  });
}

export async function restoreDefaultPrompt(templateId: string, updatedBy = "Admin"): Promise<PromptTemplate> {
  const current = await getPromptTemplateById(templateId);
  if (!current) {
    throw new Error(`Template ${templateId} not found`);
  }

  return updatePromptTemplate(templateId, {
    system_prompt: current.default_system_prompt,
    user_template: current.default_user_template,
    change_summary: "Restored to factory default configuration",
    updated_by: updatedBy,
  });
}

export function renderPrompt(
  templateStr: string,
  variables: Record<string, any>
): string {
  let result = templateStr;
  for (const [key, val] of Object.entries(variables)) {
    const replacement =
      typeof val === "object" ? JSON.stringify(val, null, 2) : String(val ?? "");
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, replacement);
  }
  return result;
}

export async function testPromptExecution(params: {
  templateId: string;
  system_prompt?: string;
  user_template?: string;
  testVariables?: Record<string, any>;
  model?: string;
}): Promise<{
  output: string;
  renderedUserPrompt: string;
  tokensUsed?: number;
  latencyMs: number;
  model: string;
}> {
  const template = await getPromptTemplateById(params.templateId);
  const sysPrompt = params.system_prompt || template?.system_prompt || "";
  const usrTemplate = params.user_template || template?.user_template || "";

  // Render variables
  const sampleVars = {
    title: "10 Reasons Why Hyderabad Restaurants Need 10-Minute Video Reels",
    primary_keyword: "restaurant reels hyderabad",
    secondary_keywords: "food reels, Jubilee Hills cafe videography, instagram marketing",
    category: "Hospitality",
    target_audience: "Cafe and restaurant owners in Hyderabad",
    existing_articles: "- Best Reel Makers in Hyderabad\n- AI Video Production for Instagram",
    target_count: 3,
    valid_urls: "- https://reelscale.in/\n- https://reelscale.in/cafe-reels-hyderabad\n- https://reelscale.in/pricing",
    outline_json: JSON.stringify({
      introduction: "Why static food photos fail on Instagram in 2026",
      key_points: ["Sensory appeal of moving video", "Location geotagging in Banjara Hills"],
    }),
    section_name: "Local Marketing Strategy",
    section_text: "In the modern digital landscape, video has become a game changer for cafes.",
    content: "# Restaurant Video Marketing in Hyderabad\n\nShort-form video has completely transformed hospitality.",
    input: "Explain why fast iPhone shoots beat bulky camera crews for busy restaurant kitchens.",
    ...(params.testVariables || {}),
  };

  const renderedUserPrompt = renderPrompt(usrTemplate, sampleVars);

  const res = await callGroqWithRetry({
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: renderedUserPrompt },
    ],
    model: params.model,
    temperature: 0.7,
    max_tokens: 1500,
    stage: `test_prompt_${params.templateId}`,
  });

  return {
    output: res.content,
    renderedUserPrompt,
    tokensUsed: res.usage?.total_tokens,
    latencyMs: res.latencyMs,
    model: res.model,
  };
}
