import { Request, Response } from "express";
import * as JobsService from "../services/jobs.service";
import Job from "../models/Job";

export async function getJobs(req: Request, res: Response): Promise<void> {
  try {
    const { q, country, role, experienceLevel, workMode, employmentType, page, limit } = req.query;
    const result = await JobsService.getAllJobs({
      q:               q               as string,
      country:         country         as string,
      role:            role            as string,
      experienceLevel: experienceLevel as string,
      workMode:        workMode        as string,
      employmentType:  employmentType  as string,
      page:  page  ? parseInt(page  as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getJobBySlug(req: Request, res: Response): Promise<void> {
  try {
    const job = await JobsService.getJobBySlug(req.params.slug as string);
    if (!job) { res.status(404).json({ success: false, message: "Job not found." }); return; }
    res.status(200).json({ success: true, data: job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createJob(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, applyUrl, companyName } = req.body;
    if (!title || !description || !applyUrl) {
      res.status(400).json({ success: false, message: "title, description, applyUrl, and companyName are required." });
      return;
    }
    const postedBy = (req as any).user?.userId;   // ← NEW
    const job = await JobsService.createJob(req.body, postedBy);   // ← pass postedBy
    res.status(201).json({ success: true, data: job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateJob(req: Request, res: Response): Promise<void> {
  try {
    const job = await JobsService.updateJob(req.params.id as string, req.body);
    if (!job) { res.status(404).json({ success: false, message: "Job not found." }); return; }
    res.status(200).json({ success: true, data: job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  try {
    const requesterId   = (req as any).user?.userId;
    const requesterRole = (req as any).user?.role;
    await JobsService.deleteJob(req.params.id as string, requesterId, requesterRole);
    res.status(200).json({ success: true, message: "Job deleted." });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

export async function seedJobs(req: Request, res: Response): Promise<void> {
  try {
    const result = await JobsService.seedJobs();
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}