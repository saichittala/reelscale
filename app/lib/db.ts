import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | null = null;

const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_rv6Kg5InXGNL@ep-dry-forest-b3wk5pmu-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export function getDb(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }
  if (!cachedSql) {
    cachedSql = neon(url);
  }
  return cachedSql;
}

export async function checkDbHealth(): Promise<{
  status: "connected" | "error";
  latencyMs: number | null;
  message?: string;
}> {
  const start = Date.now();
  try {
    const sql = getDb();
    await sql`SELECT 1 as ping;`;
    const latencyMs = Date.now() - start;
    return { status: "connected", latencyMs };
  } catch (err: any) {
    return {
      status: "error",
      latencyMs: null,
      message: err.message || "Failed to ping Neon database",
    };
  }
}

// ─── STRONGLY TYPED DATABASE SCHEMA MODELS ───

export interface DbUserRow {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbClientRow {
  id: number;
  name: string;
  business?: string | null;
  phone?: string | null;
  instagram?: string | null;
  reels?: number | null;
  ppr?: number | string | null;
  image?: string | null;
  billing_model?: string | null;
  plan?: string | null;
  base_rate?: number | string | null;
  bargain?: number | string | null;
  revenue?: number | string | null;
  date?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbSaleRow {
  id: number;
  category?: string | null;
  company_name?: string | null;
  contact_person?: string | null;
  phone_number?: string | null;
  notes?: string | null;
  contacted?: string | null;
  created_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbDeliveryRow {
  id: string;
  client_id: number | string;
  month: string;
  title: string;
  delivered_date: string;
  link?: string | null;
  status: "Delivered" | "In Review" | "Scheduled" | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

