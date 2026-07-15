import { Request, Response } from "express";
import mongoose from "mongoose";
import Profile from "../models/Profile";
import User from "../models/User";
import { buildCandidateMatchStage } from "../utils/candidateFilters";
import { extractJdRequirements } from "../services/jdRequirementsExtractor";
import { scoreCandidateAgainstJd } from "../services/candidateJdScorer";

// Hard cap on how many candidates get scored in one request. This is
// a synchronous, in-memory scoring pass (deliberately — see the
// scorer file for why it's not per-candidate AI calls), so it's fast
// even at this size, but an unbounded pool on a much bigger platform
// later would need batching. 300 comfortably covers this app's scale.
const MAX_CANDIDATES_TO_SCORE = 300;

// ── POST /api/candidates/rank-by-jd ───────────────────────────
// Body: { jobDescription: string, ...same filter fields as GET /api/candidates }
// (skills, noticePeriod, country, city, relocate, hasResume, q, minExp, maxExp)
//
// Returns the ENTIRE scored + sorted pool in one response (not
// server-paginated) — the frontend paginates client-side over the
// already-scored list. This is intentional: it means changing pages
// while a ranking is active never re-calls Gemini, only the initial
// "Rank" click does.
export const rankCandidatesByJD = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription } = req.body as { jobDescription?: string };
    if (!jobDescription || jobDescription.trim().length < 30) {
      res.status(400).json({ success: false, message: "Please paste the full job description (it looks too short)." });
      return;
    }

    // ── Step 1: parse the JD once ────────────────────────────
    let requirements;
    try {
      requirements = await extractJdRequirements(jobDescription);
    } catch (err) {
      res.status(422).json({
        success: false,
        message: err instanceof Error ? err.message : "Could not analyze that job description.",
      });
      return;
    }

    // ── Step 2: fetch the filtered candidate pool ────────────
    // Same filters as the normal search (skills/notice/country/etc,
    // if the recruiter had any active) via the shared helper, plus
    // the extra fields (certifications, experience) the scorer needs
    // that the plain listing endpoint doesn't bother projecting.
    const { matchStage, searchStage } = buildCandidateMatchStage(req.query as Record<string, string>);

    const pipeline: mongoose.PipelineStage[] = [
      {
        $lookup: {
          from: User.collection.name,
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $match: matchStage },
      ...searchStage,
      { $limit: MAX_CANDIDATES_TO_SCORE },
      {
        $project: {
          _id: 0,
          userId: "$userInfo._id",
          name: "$userInfo.name",
          email: "$userInfo.email",
          avatar: 1,
          headline: 1,
          currentDesignation: 1,
          currentCompany: 1,
          location: 1,
          totalExperienceYears: 1,
          totalExperienceMonths: 1,
          noticePeriod: 1,
          expectedSalaryLPA: 1,
          salesforceSkills: 1,
          skills: 1,
          certifications: 1,
          experience: 1,
          willingToRelocate: 1,
          resume: 1,
          trailheadRank: 1,
        },
      },
    ];

    const candidates = await Profile.aggregate(pipeline);

    // ── Step 3: score + sort, all deterministic, no more AI calls ──
    const scored = candidates
      .map((c) => {
        const { score, matchedSkills, missingSkills } = scoreCandidateAgainstJd(c, requirements);
        const { certifications, experience, ...publicFields } = c;
        return { ...publicFields, matchScore: score, matchedSkills, missingSkills };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: scored,
      total: scored.length,
      truncated: candidates.length >= MAX_CANDIDATES_TO_SCORE,
      requirements,
    });
  } catch (err) {
    console.error("rankCandidatesByJD error:", err);
    res.status(500).json({ success: false, message: "Something went wrong while ranking candidates." });
  }
};