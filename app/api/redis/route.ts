import { NextResponse } from "next/server";
import { checkRedisHealth, redisGet, redisSet } from "../../lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await checkRedisHealth();

    // Perform a roundtrip write & read test if connected
    let roundtripSuccess = false;
    if (health.status === "connected") {
      const testKey = "system:healthcheck";
      await redisSet(testKey, { timestamp: Date.now() }, 10);
      const testVal = await redisGet(testKey);
      roundtripSuccess = Boolean(testVal);
    }

    return NextResponse.json({
      success: health.status === "connected",
      server: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT || 6379),
        status: health.status,
        pingLatencyMs: health.pingMs,
        uptimeSeconds: health.uptimeSeconds,
        connectedClients: health.connectedClients,
        readWriteVerified: roundtripSuccess,
        message: health.message,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to query Redis server status",
      },
      { status: 500 }
    );
  }
}
