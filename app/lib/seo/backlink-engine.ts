import { getDb } from "../db";
import { getPromptTemplateById, renderPrompt } from "../ai/prompt-service";
import { callGroqWithRetry } from "../ai/groq-client";

export interface BacklinkOpportunity {
  id: number;
  domain: string;
  website_url: string;
  target_reelscale_url: string;
  relevance_score: number;
  suggested_anchor_text: string;
  opportunity_type: string;
  contact_name?: string;
  contact_email?: string;
  outreach_status: "Identified" | "Drafted" | "Contacted" | "Follow-up" | "Acquired" | "Rejected";
  outreach_email_draft?: string;
  verified_backlink_status: boolean;
  date_acquired?: string | null;
  follow_up_date?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getAllBacklinks(statusFilter?: string): Promise<BacklinkOpportunity[]> {
  const sql = getDb();
  if (statusFilter && statusFilter !== "all") {
    const rows = await sql.query(
      `SELECT * FROM backlink_opportunities WHERE outreach_status = $1 ORDER BY id DESC;`,
      [statusFilter]
    );
    return rows as BacklinkOpportunity[];
  }
  const rows = await sql.query(`SELECT * FROM backlink_opportunities ORDER BY id DESC;`);
  return rows as BacklinkOpportunity[];
}

export async function discoverBacklinkOpportunities(params: {
  topicTitle?: string;
  category?: string;
}): Promise<BacklinkOpportunity[]> {
  const template = await getPromptTemplateById("backlink_research");
  const renderedPrompt = renderPrompt(
    template?.user_template ||
      `Article Topic: {{title}}\nTarget Category: {{category}}\nReelScale Positioning: On-location 10-minute short-form video creation in Hyderabad.`,
    {
      title: params.topicTitle || "Top Video Production & Reel Makers in Hyderabad",
      category: params.category || "Video Production",
    }
  );

  const res = await callGroqWithRetry({
    messages: [
      {
        role: "system",
        content: `${template?.system_prompt || "You are an Ethical PR & Link Building Strategist."}
Respond ONLY in JSON format: {"opportunities": [{"domain":"...","website_url":"...","target_reelscale_url":"...","relevance_score":85,"suggested_anchor_text":"...","opportunity_type":"Resource Page Mention|Editorial Feature|Guest Contribution","contact_name":"...","contact_email":"...","notes":"...","outreach_email_draft":"..."}]}`,
      },
      { role: "user", content: renderedPrompt },
    ],
    temperature: 0.4,
    max_tokens: 2000,
    stage: "backlink_discovery",
    response_format: { type: "json_object" },
  });

  let rawList: any[] = [];
  try {
    const parsed = JSON.parse(res.content);
    rawList = Array.isArray(parsed) ? parsed : parsed.opportunities || [];
  } catch {}

  const sql = getDb();
  const inserted: BacklinkOpportunity[] = [];

  for (const item of rawList) {
    if (!item?.domain || !item?.website_url) continue;

    try {
      const existing = await sql.query(
        `SELECT id FROM backlink_opportunities WHERE domain = $1 LIMIT 1;`,
        [item.domain]
      );
      if (existing.length > 0) continue;

      const rows = await sql.query(
        `INSERT INTO backlink_opportunities (
          domain, website_url, target_reelscale_url, relevance_score, suggested_anchor_text,
          opportunity_type, contact_name, contact_email, outreach_status, outreach_email_draft, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Identified', $9, $10)
        RETURNING *;`,
        [
          item.domain,
          item.website_url,
          item.target_reelscale_url || "https://reelscale.in",
          Number(item.relevance_score) || 80,
          item.suggested_anchor_text || "ReelScale video production in Hyderabad",
          item.opportunity_type || "Editorial Mention",
          item.contact_name || "Editorial Team",
          item.contact_email || null,
          item.outreach_email_draft || null,
          item.notes || "Discovered via AI market research",
        ]
      );
      if (rows.length > 0) inserted.push(rows[0] as BacklinkOpportunity);
    } catch (e) {
      console.warn("Error inserting backlink opportunity:", e);
    }
  }

  return inserted;
}

export async function updateBacklinkOpportunity(
  id: number,
  data: Partial<BacklinkOpportunity>
): Promise<BacklinkOpportunity> {
  const sql = getDb();
  const rows = await sql.query(
    `UPDATE backlink_opportunities
     SET outreach_status = COALESCE($1, outreach_status),
         outreach_email_draft = COALESCE($2, outreach_email_draft),
         verified_backlink_status = COALESCE($3, verified_backlink_status),
         date_acquired = COALESCE($4, date_acquired),
         follow_up_date = COALESCE($5, follow_up_date),
         notes = COALESCE($6, notes),
         updated_at = NOW()
     WHERE id = $7
     RETURNING *;`,
    [
      data.outreach_status,
      data.outreach_email_draft,
      data.verified_backlink_status,
      data.date_acquired,
      data.follow_up_date,
      data.notes,
      id,
    ]
  );
  if (rows.length === 0) throw new Error(`Backlink opportunity #${id} not found`);
  return rows[0] as BacklinkOpportunity;
}
