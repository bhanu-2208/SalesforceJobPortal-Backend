// controllers/feedback.controller.ts
import { Request, Response } from "express";
import * as FeedbackService from "../services/Feedback.service";

// POST /api/feedback  (logged-in users only)
export async function createFeedback(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Please log in to submit feedback." });
      return;
    }

    const { name, email, role, category, rating, message } = req.body;

    if (!name || !email || !rating || !message) {
      res.status(400).json({ success: false, message: "Name, email, rating, and message are required." });
      return;
    }

    const feedback = await FeedbackService.createFeedback({
      userId, name, email, role, category, rating: Number(rating), message,
    });

    res.status(201).json({ success: true, data: feedback });
    return;
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message || "Failed to submit feedback." });
    return;
  }
}

// GET /api/feedback  (admin only)
export async function getAllFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { status, page, limit } = req.query;
    const result = await FeedbackService.getAllFeedback({
      status: status as string,
      page:   page  ? parseInt(page  as string) : 1,
      limit:  limit ? parseInt(limit as string) : 20,
    });
    res.status(200).json({ success: true, ...result });
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
}

// GET /api/feedback/mine  (logged-in user's own feedback)
export async function getMyFeedback(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const data   = await FeedbackService.getMyFeedback(userId);
    res.status(200).json({ success: true, data });
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
}

// PATCH /api/feedback/:id/status  (admin only)
export async function updateFeedbackStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    const updated = await FeedbackService.updateFeedbackStatus(req.params.id as string, status);
    res.status(200).json({ success: true, data: updated });
    return;
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
    return;
  }
}

// DELETE /api/feedback/:id  (admin only)
export async function deleteFeedback(req: Request, res: Response): Promise<void> {
  try {
    await FeedbackService.deleteFeedback(req.params.id as string);
    res.status(200).json({ success: true, message: "Feedback deleted." });
    return;
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, message: err.message });
    return;
  }
}