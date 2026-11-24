export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutonomousCronWorker } = await import("./app/lib/scheduler/server-worker");
    startAutonomousCronWorker();
  }
}
