export async function register() {
  // Only start in-memory persistent background worker in dedicated Node.js environments (not ephemeral Vercel Serverless)
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    !process.env.VERCEL &&
    !process.env.NEXT_DEPLOYMENT_ID
  ) {
    try {
      const { startAutonomousCronWorker } = await import("./app/lib/scheduler/server-worker");
      startAutonomousCronWorker();
    } catch (err: any) {
      console.warn("[Instrumentation] Notice: background cron worker not started:", err?.message);
    }
  }
}

