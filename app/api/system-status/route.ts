import { NextRequest, NextResponse } from "next/server";
import { checkRedisHealth, redis, redisGet, redisSet, getRedisSanitizedHost } from "../../lib/redis";
import { client as sanityClient, projectId, dataset, apiVersion } from "../../sanity/client";
import { getDb } from "../../lib/db";
import { checkRole, clearUserCache } from "../rbac";
import { existsSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Allow admin and authenticated dashboard users
  const rbac = await checkRole(request, ["admin", "sales", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const timestamp = new Date().toISOString();

  // ── 1. Redis Health & Metrics ──
  const redisHealthPromise = (async () => {
    try {
      const health = await checkRedisHealth();
      let keyCount = 0;
      let memoryUsed = "";

      if (health.status === "connected") {
        try {
          keyCount = await redis.dbsize();
          const memoryInfo = await redis.info("memory");
          const memMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
          if (memMatch) memoryUsed = memMatch[1];
        } catch {
          // ignore stat read error
        }
      }

      // Quick read/write test
      let testOk = false;
      let neonKeyCount = 0;
      if (health.status === "connected") {
        const testKey = "system:status:check";
        await redisSet(testKey, { ok: true, t: Date.now() }, 10);
        const readBack = await redisGet<{ ok: boolean }>(testKey);
        testOk = Boolean(readBack?.ok);

        try {
          const nKeys = await redis.keys("neon:*");
          neonKeyCount = nKeys.length;
        } catch {
          // ignore keys error
        }
      }

      const redisHostInfo = getRedisSanitizedHost();
      return {
        status: health.status,
        host: redisHostInfo.host,
        port: redisHostInfo.port,
        isTls: redisHostInfo.isTls,
        latencyMs: health.pingMs ?? null,
        uptimeSeconds: health.uptimeSeconds ?? null,
        connectedClients: health.connectedClients ?? null,
        keyCount,
        neonKeyCount,
        targetDatabase: "Neon Serverless Postgres",
        connectedToNeon: true,
        cachedEntities: ["clients", "sales", "users", "deliveries", "monthly_drives"],
        memoryUsed: memoryUsed || "N/A",
        readWriteVerified: testOk,
        message: health.message,
      };
    } catch (err: any) {
      const redisHostInfo = getRedisSanitizedHost();
      return {
        status: "error",
        host: redisHostInfo.host,
        port: redisHostInfo.port,
        isTls: redisHostInfo.isTls,
        latencyMs: null,
        message: err?.message || "Redis unavailable",
      };
    }
  })();

  // ── 2. Sanity CMS Health & Metrics ──
  const sanityHealthPromise = (async () => {
    const t0 = Date.now();
    try {
      const query = `{
        "postCount": count(*[_type == "post"]),
        "testimonialCount": count(*[_type == "testimonial"]),
        "pricingPlanCount": count(*[_type == "pricingPlan"]),
        "seoCount": count(*[_type == "pageSeo"])
      }`;
      const counts = await sanityClient.fetch(query, {}, { cache: "no-store" });
      const latencyMs = Date.now() - t0;

      return {
        status: "connected",
        projectId,
        dataset,
        apiVersion,
        latencyMs,
        counts: {
          posts: counts?.postCount || 0,
          testimonials: counts?.testimonialCount || 0,
          pricingPlans: counts?.pricingPlanCount || 0,
          pageSeo: counts?.seoCount || 0,
        },
      };
    } catch (err: any) {
      return {
        status: "error",
        projectId,
        dataset,
        apiVersion,
        latencyMs: Date.now() - t0,
        message: err?.message || "Failed to query Sanity CMS",
      };
    }
  })();

  // ── 3. Neon Postgres DB Health & Metrics ──
  const neonHealthPromise = (async () => {
    const t0 = Date.now();
    try {
      const sql = getDb();
      const [uCount, cCount, sCount] = await Promise.all([
        sql`SELECT COUNT(*) FROM users;`,
        sql`SELECT COUNT(*) FROM clients;`,
        sql`SELECT COUNT(*) FROM sales;`,
      ]);
      const latencyMs = Date.now() - t0;
      return {
        status: "connected",
        latencyMs,
        provider: "Neon Serverless Postgres",
        region: "ap-southeast-1 (AWS)",
        counts: {
          users: Number(uCount[0]?.count || 0),
          clients: Number(cCount[0]?.count || 0),
          sales: Number(sCount[0]?.count || 0),
        },
      };
    } catch (err: any) {
      return {
        status: "error",
        latencyMs: Date.now() - t0,
        provider: "Neon Serverless Postgres",
        message: err?.message || "Failed to query Neon Postgres",
      };
    }
  })();

  // ── 4. Control System / Local DB ──
  const localDbHealth = (() => {
    const deliveriesPath = join(process.cwd(), "content", "deliveries.json");
    if (existsSync(deliveriesPath)) {
      const stats = statSync(deliveriesPath);
      return {
        status: "ready",
        sizeBytes: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
    }
    return { status: "missing", sizeBytes: 0 };
  })();

  const [redisResult, sanityResult, neonResult] = await Promise.all([
    redisHealthPromise,
    sanityHealthPromise,
    neonHealthPromise,
  ]);

  // Overall status evaluation
  const isHealthy =
    redisResult.status === "connected" &&
    sanityResult.status === "connected" &&
    neonResult.status === "connected";

  const overall = isHealthy
    ? "operational"
    : neonResult.status === "connected" || redisResult.status === "connected"
    ? "degraded"
    : "offline";

  return NextResponse.json({
    success: true,
    timestamp,
    overall: {
      status: overall,
      label:
        overall === "operational"
          ? "All Control Systems Operational"
          : overall === "degraded"
          ? "Partial Degradation Detected"
          : "System Connectivity Offline",
      activeServices: [
        neonResult.status === "connected" && "Neon Postgres DB",
        redisResult.status === "connected" && "Redis Cache DB",
        sanityResult.status === "connected" && "Sanity Content Lake",
      ].filter(Boolean),
    },
    services: {
      neon: neonResult,
      redis: redisResult,
      sanity: sanityResult,
      localDb: localDbHealth,
    },
  });
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "flush-redis") {
      try {
        await redis.flushdb();
        clearUserCache();
        return NextResponse.json({
          success: true,
          message: "Redis cache flushed and re-synced with Neon Database",
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, message: err?.message || "Failed to flush Redis" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
