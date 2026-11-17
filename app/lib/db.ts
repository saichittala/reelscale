import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }
  if (!cachedSql) {
    cachedSql = neon(url);
  }
  return cachedSql;
}
