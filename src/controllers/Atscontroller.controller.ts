import { Request, Response } from "express";
import path from "path";
import Job from "../models/Job";
import Profile from "../models/Profile";
import AtsCheck from "../models/Atscheck";
import { extractResumeTextFromUrl } from "../services/resumeTextExtract.service";
import { runAtsCheck } from "../services/Atsscorer.service";

// ── GET /api/ats/:jobId ───────────────────────────────────────
// Returns the candidate's ATS match score against a specific job,
// computed from the resume on their profile. Cached per (user, job)
// pair — re-visiting the same job's ATS score without changing your
// resume returns the cached result instantly instead of calling
// Gemini again.
export const getAtsScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    const profile = await Profile.findOne({ user: userId });
    if (!profile?.resume?.url) {
      res.status(400).json({
        success: false,
        message: "Upload a resume to your profile before checking your ATS score.",
        code: "NO_RESUME",
      });
      return;
    }

    // ── Cache check ──────────────────────────────────────────
    const cached = await AtsCheck.findOne({ user: userId, job: jobId });
    if (cached && cached.resumeUploadedAt.getTime() === new Date(profile.resume.uploadedAt!).getTime()) {
      res.json({ success: true, cached: true, result: cached });
      return;
    }

    // ── Extract resume text ──────────────────────────────────
    const resumePath = path.join(__dirname, "..", profile.resume.url);
    let resumeText: string;
    try {
      // console.log("Resume URL:", profile.resume.url);
      resumeText = await extractResumeTextFromUrl(profile.resume.url as string);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Could not read your resume file.",
      });
      return;
    }

    // ── Run the check ─────────────────────────────────────────
    const result = await runAtsCheck(resumeText, job.description, job.skills || []);

    const saved = await AtsCheck.findOneAndUpdate(
      { user: userId, job: jobId },
      { ...result, resumeUploadedAt: profile.resume.uploadedAt },
      { new: true, upsert: true }
    );

    res.json({ success: true, cached: false, result: saved });
  } catch (err) {
    // console.error("getAtsScore error:", err);
    res.status(500).json({ success: false, message: "Something went wrong while checking your ATS score." });
  }
};