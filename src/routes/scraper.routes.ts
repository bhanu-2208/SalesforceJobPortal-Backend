// routes/scraper.routes.ts

import { Router } from "express";
import { runJobImport } from "../services/jobScraper.service";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Admin can manually trigger from frontend
router.post(
  "/run",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      const result = await runJobImport();
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// External scheduler
router.post(
  "/cron",
  async (req, res) => {
    try {
      const secret = req.header("x-scraper-secret");

      if (secret !== process.env.SCRAPER_SECRET) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const result = await runJobImport();

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

export default router;