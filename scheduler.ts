// scheduler.ts
// Runs the job import automatically every 12 hours using node-cron.

import cron from "node-cron";
import { runJobImport } from "./src/services/jobScraper.service";

export function startJobScheduler() {
  // Cron format: minute hour day month weekday
  // "0 */12 * * *" = at minute 0, every 12th hour (00:00 and 12:00 server time)
  cron.schedule("*/50 * * * *", async () => {
    console.log("⏰  5-minu+te scheduled job import triggered");
    await runJobImport();
  });

  console.log("✅  Job scheduler started — imports run every 5 minutes");
}