/**
 * Production Redis Caching Verification & Test Suite
 *
 * Covers:
 * 1. Redis Connection & TLS configuration
 * 2. Cache-aside flow: Cache MISS -> Cache HIT -> Data Verification
 * 3. Latency comparison (Cached vs Uncached)
 * 4. TTL expiration
 * 5. Cache invalidation on mutation (add/update/delete)
 * 6. Sanity pattern invalidation
 * 7. Redis downtime / failure simulation & graceful fallback
 * 8. Circuit breaker fast-fail behavior
 */

try {
  process.loadEnvFile?.(".env.local");
} catch {}

import {
  redisGet,
  redisSet,
  redisDel,
  redisInvalidatePattern,
  redisRemember,
  checkRedisHealth,
  isCircuitBreakerOpen,
  tripCircuitBreaker,
  resetRedisCircuitBreaker,
  getRedisSanitizedHost
} from "../app/lib/redis";
import { getDb } from "../app/lib/db";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🚀 PRODUCTION REDIS CACHING AUDIT & VERIFICATION SUITE");
  console.log("=======================================================\n");

  // --- Test 1: Connection & Host Configuration ---
  console.log("▶ TEST 1: Connection & Host Configuration");
  const hostInfo = getRedisSanitizedHost();
  console.log(`  Configured Host: ${hostInfo.host}, Port: ${hostInfo.port}, TLS: ${hostInfo.isTls}`);
  const health = await checkRedisHealth();
  assert(health.status === "connected", `Redis health check status: ${health.status}`);
  assert(typeof health.pingMs === "number" && health.pingMs >= 0, `Ping latency: ${health.pingMs}ms`);

  // --- Test 2: Neon DB Connectivity ---
  console.log("\n▶ TEST 2: Neon Database Connectivity");
  const sql = getDb();
  const dbStart = Date.now();
  const neonRes = await sql`SELECT 1 as ping`;
  const dbLatency = Date.now() - dbStart;
  assert(Array.isArray(neonRes) && (neonRes[0] as any).ping === 1, `Neon DB reachable (${dbLatency}ms)`);

  // --- Test 3: Cache MISS -> Database Fetch -> Cache SET -> Cache HIT ---
  console.log("\n▶ TEST 3: Cache MISS -> Store in Redis -> Cache HIT");
  const testKey = `neon:test:client:staff_${Date.now()}`;
  await redisDel(testKey);

  let dbQueriesExecuted = 0;
  async function fetchClientFromNeon() {
    dbQueriesExecuted++;
    const rows = await sql`SELECT id, name, business FROM clients ORDER BY id ASC LIMIT 3;`;
    return rows;
  }

  // Request 1: Must be a Cache MISS
  const r1Start = Date.now();
  const res1 = await redisRemember(testKey, 15, fetchClientFromNeon);
  const r1Latency = Date.now() - r1Start;
  assert(dbQueriesExecuted === 1, `Request 1: Cache MISS triggered Database query (${r1Latency}ms)`);
  assert(Array.isArray(res1) && res1.length > 0, `Request 1: Returned valid data from Neon`);

  // Request 2: Must be a Cache HIT (0 additional DB queries)
  const r2Start = Date.now();
  const res2 = await redisRemember(testKey, 15, fetchClientFromNeon);
  const r2Latency = Date.now() - r2Start;
  assert(dbQueriesExecuted === 1, `Request 2: Cache HIT reused Redis data (0 DB queries, ${r2Latency}ms)`);
  assert(JSON.stringify(res1) === JSON.stringify(res2), "Request 2: Returned identical payload");
  assert(r2Latency <= r1Latency, `Request 2: Cache HIT (${r2Latency}ms) faster or equal to DB query (${r1Latency}ms)`);

  // --- Test 4: TTL Expiration ---
  console.log("\n▶ TEST 4: TTL Expiration Handling");
  const ttlKey = `neon:test:ttl_${Date.now()}`;
  await redisSet(ttlKey, { message: "expire-me" }, 1); // 1 second TTL
  const immediateVal = await redisGet<{ message: string }>(ttlKey);
  assert(immediateVal !== null && immediateVal.message === "expire-me", "Immediate read before TTL expiration succeeded");

  console.log("  ⏳ Waiting 1.2s for TTL expiration...");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const expiredVal = await redisGet(ttlKey);
  assert(expiredVal === null, "Key expired after TTL window (returned null)");

  // --- Test 5: Cache Invalidation on Mutation ---
  console.log("\n▶ TEST 5: Cache Invalidation on Mutation (DEL)");
  const clientCacheKey = "neon:clients:list";
  await redisSet(clientCacheKey, { clients: [{ id: 999, name: "Temporary" }] }, 120);
  const beforeDel = await redisGet(clientCacheKey);
  assert(beforeDel !== null, "Key present in Redis prior to mutation");

  // Invalidate (simulating POST add/update/delete)
  const delResult = await redisDel(clientCacheKey);
  assert(delResult === true, "redisDel returned true on cache invalidation");
  const afterDel = await redisGet(clientCacheKey);
  assert(afterDel === null, "Cache key deleted, next request will fetch fresh from Neon");

  // --- Test 6: Pattern Invalidation (SCAN) ---
  console.log("\n▶ TEST 6: Pattern Invalidation via SCAN (Non-blocking)");
  const prefix = `sanity:blogs:test_${Date.now()}`;
  await redisSet(`${prefix}:1`, { title: "Blog 1" }, 60);
  await redisSet(`${prefix}:2`, { title: "Blog 2" }, 60);
  await redisSet(`${prefix}:3`, { title: "Blog 3" }, 60);

  const deletedKeysCount = await redisInvalidatePattern(`${prefix}:*`);
  assert(deletedKeysCount === 3, `Pattern scan deleted exactly ${deletedKeysCount} matching keys`);
  const check1 = await redisGet(`${prefix}:1`);
  assert(check1 === null, "Pattern-matched keys verified completely removed");

  // --- Test 7: Circuit Breaker & Safe Fallback when Redis Fails ---
  console.log("\n▶ TEST 7: Redis Downtime Simulation & Circuit Breaker Fast-Fail");
  resetRedisCircuitBreaker();
  assert(isCircuitBreakerOpen() === false, "Circuit breaker is closed during normal operation");

  // Simulate outage
  tripCircuitBreaker("Simulated network outage test");
  assert(isCircuitBreakerOpen() === true, "Circuit breaker successfully tripped on failure");

  const fastFailStart = Date.now();
  const fallbackVal = await redisGet("neon:any:key");
  const fastFailLatency = Date.now() - fastFailStart;
  assert(fallbackVal === null, "Redis fast-fails and returns null during outage (no hanging)");
  assert(fastFailLatency < 10, `Fast-fail latency: ${fastFailLatency}ms (instant Neon fallback without 504 gateway timeout)`);

  // Direct Neon fetch continues working 100% uninterrupted during Redis outage
  const directNeonFetch = await sql`SELECT COUNT(*) FROM clients;`;
  assert(Number((directNeonFetch[0] as any).count) > 0, "Neon DB continues serving queries seamlessly during Redis downtime");

  // Reset circuit breaker for normal service
  resetRedisCircuitBreaker();
  assert(isCircuitBreakerOpen() === false, "Circuit breaker reset to normal operational state");

  // Clean up test keys
  await redisDel(testKey);

  console.log("\n=======================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  });
