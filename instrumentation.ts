export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { startAutonomousCronWorker } = await import("./app/lib/scheduler/server-worker");
    startAutonomousCronWorker();
  }
}
