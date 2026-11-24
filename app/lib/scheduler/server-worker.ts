import { evaluateAndTriggerScheduler } from "./cron-scheduler";

let isStarted = false;

/**
 * Autonomous in-process background worker for Next.js Node server
 * Runs every 60 seconds to evaluate the schedule and execute pending generation batches
 */
export function startAutonomousCronWorker() {
  if (isStarted) return;
  isStarted = true;

  console.log("[ReelScale Autonomous Engine] Server-side scheduler worker initialized.");

  // Initial check after 5 seconds
  setTimeout(async () => {
    try {
      const res = await evaluateAndTriggerScheduler();
      if (res.triggered) {
        console.log(`[ReelScale Autonomous Engine] Schedule triggered: ${res.message}`);
      }
    } catch (err: any) {
      console.warn("[ReelScale Autonomous Engine] Initial schedule check warning:", err?.message);
    }
  }, 5000);

  // Periodic check every 60 seconds
  setInterval(async () => {
    try {
      const res = await evaluateAndTriggerScheduler();
      if (res.triggered) {
        console.log(`[ReelScale Autonomous Engine] Schedule triggered: ${res.message}`);
      }
    } catch (err: any) {
      console.warn("[ReelScale Autonomous Engine] Periodic schedule check warning:", err?.message);
    }
  }, 60000);
}
