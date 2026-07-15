// controllers/appliedJobs.controller.ts
import { Request, Response } from "express";
import * as AppliedJobsService from "../services/Appliedjobs.service";

export async function markApplied(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const applied = await AppliedJobsService.markApplied(userId, req.params.jobId as string);
    res.status(201).json({ success: true, data: applied });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

export async function unmarkApplied(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    await AppliedJobsService.unmarkApplied(userId, req.params.jobId as string);
    res.status(200).json({ success: true, message: "Removed from applied jobs." });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

export async function getMyAppliedJobs(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const data = await AppliedJobsService.getMyAppliedJobs(userId);
    res.status(200).json({ success: true, data, total: data.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyAppliedJobIds(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const ids = await AppliedJobsService.getMyAppliedJobIds(userId);
    res.status(200).json({ success: true, data: ids });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}