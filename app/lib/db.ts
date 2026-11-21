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
