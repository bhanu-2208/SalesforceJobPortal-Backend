import { Request, Response } from "express";
import SavedCandidate from "../models/SavedCandidate";

// ── POST /api/saved-candidates/:candidateId ──────────────────
// Upsert so re-saving someone already saved just updates the note
// instead of erroring on the unique index.
export const saveCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const recruiterId = req.user!.userId;
    const { candidateId } = req.params;
    const { note } = req.body as { note?: string };

    const saved = await SavedCandidate.findOneAndUpdate(
      { recruiter: recruiterId, candidate: candidateId },
      { $set: { ...(note !== undefined ? { note } : {}) } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, saved });
  } catch (err) {
    // console.error("saveCandidate error:", err);
    res.status(500).json({ success: false, message: "Failed to save candidate" });
  }
};

// ── DELETE /api/saved-candidates/:candidateId ────────────────
export const unsaveCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const recruiterId = req.user!.userId;
    const { candidateId } = req.params;

    await SavedCandidate.findOneAndDelete({ recruiter: recruiterId, candidate: candidateId });
    res.json({ success: true });
  } catch (err) {
    // console.error("unsaveCandidate error:", err);
    res.status(500).json({ success: false, message: "Failed to remove saved candidate" });
  }
};

// ── GET /api/saved-candidates/ids ─────────────────────────────
// Lightweight endpoint the candidates list page calls once on load
// to know which bookmark icons should render as "already saved" —
// same pattern as /api/saved-jobs/ids.
export const getSavedCandidateIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const recruiterId = req.user!.userId;
    const saved = await SavedCandidate.find({ recruiter: recruiterId }).select("candidate").lean();
    res.json({ success: true, data: saved.map((s) => String(s.candidate)) });
  } catch (err) {
    // console.error("getSavedCandidateIds error:", err);
    res.status(500).json({ success: false, message: "Failed to load saved candidates" });
  }
};