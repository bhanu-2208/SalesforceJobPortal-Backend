// controllers/aiJob.controller.ts
import { Request, Response } from "express";
import { parseJobDescription } from "../services/aiJobParser.service";

// POST /api/jobs/generate
export async function generateJob(req: Request, res: Response): Promise<void> {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== "string") {
      res.status(400).json({ success: false, message: "jobDescription is required." });
      return;
    }

    if (jobDescription.trim().length < 50) {
      res.status(400).json({ success: false, message: "Job description is too short. Please provide at least 50 characters." });
      return;
    }

    const job = await parseJobDescription(jobDescription);

    res.status(200).json({ success: true, job });
    return;
  } catch (err: any) {
    console.error("❌ generateJob error:", err.message);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to generate job from description.",
    });
    return;
  }
}