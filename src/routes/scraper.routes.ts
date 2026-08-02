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
// router.post(
//   "/cron",
//   async (req, res) => {
//     try {
//       console.log("⏰ External cron triggered:", new Date().toISOString());

//       const secret = req.header("x-scraper-secret");

//       if (secret !== process.env.SCRAPER_SECRET) {
//         return res.status(403).json({
//           success: false,
//           message: "Forbidden",
//         });
//       }

//       const result = await runJobImport();

//       res.status(200).json({
//         success: true,
//         ...result,
//       });
//     } catch (err: any) {
//       res.status(500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   }
// );

router.post("/cron", async (req, res) => {
  console.log(
    "🔥 CRON REQUEST RECEIVED",
    new Date().toISOString()
  );

  const secret = req.header("x-scraper-secret");

  if (secret !== process.env.SCRAPER_SECRET) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  try {
    const result = await runJobImport();

    res.status(200).json({
      success: true,
      message: "Job import completed",
      imported: result.imported,
      skipped: result.skipped,
      rejected: result.rejected,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/run-now", async (_req, res) => {
  try {
    const result = await runJobImport();

    res.status(200).json({
      success: true,
      message: "Job import completed",
      imported: result.imported,
      skipped: result.skipped,
      rejected: result.rejected,
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;