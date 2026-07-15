// routes/scraper.routes.ts
// Manual trigger endpoint — lets an admin run the import on-demand
// instead of waiting for the next scheduled cycle. Useful for testing.

import { Router } from "express";
import { runJobImport } from "../services/jobScraper.service";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/scraper/run  (admin only)
router.post("/run", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await runJobImport();
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;