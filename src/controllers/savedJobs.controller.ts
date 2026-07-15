import { Request, Response } from "express";
import * as SavedJobsService from "../services/Savedjobs.service";

// POST /api/saved-jobs/:jobId
export async function saveJob(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { jobId } = req.params;
    const saved = await SavedJobsService.saveJob(userId, jobId as string);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// DELETE /api/saved-jobs/:jobId
export async function unsaveJob(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { jobId } = req.params;
    await SavedJobsService.unsaveJob(userId, jobId as string);
    res.status(200).json({ success: true, message: "Job removed from saved." });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// GET /api/saved-jobs
export async function getSavedJobs(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const saved  = await SavedJobsService.getSavedJobs(userId);
    res.status(200).json({ success: true, data: saved, total: saved.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/saved-jobs/ids
export async function getSavedJobIds(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const ids    = await SavedJobsService.getSavedJobIds(userId);
    res.status(200).json({ success: true, data: ids });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}