import { Request, Response } from "express";
import mongoose from "mongoose";
import Profile from "../models/Profile";
import User from "../models/User";
import { buildCandidateMatchStage } from "../utils/candidateFilters";

// ── GET /api/candidates ──────────────────────────────────────
// Unchanged behavior from before — the only difference from the
// original version of this file is that filter-building now comes
// from utils/candidateFilters.ts, shared with the new rank-by-JD
// endpoint, instead of being duplicated inline here.
export const getCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = "1", limit = "12" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

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
      { $sort: { updatedAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 0,
                userId: "$userInfo._id",
                name: "$userInfo.name",
                email: "$userInfo.email",
                avatar: 1,
                headline: 1,
                summary: 1,
                location: 1,
                currentDesignation: 1,
                currentCompany: 1,
                totalExperienceYears: 1,
                totalExperienceMonths: 1,
                noticePeriod: 1,
                employmentType: 1,
                expectedSalaryLPA: 1,
                salesforceSkills: 1,
                skills: 1,
                trailheadRank: 1,
                willingToRelocate: 1,
                resume: 1,
                profileCompleteness: 1,
                updatedAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await Profile.aggregate(pipeline);
    const data = result?.data ?? [];
    const total = result?.totalCount?.[0]?.count ?? 0;

    res.json({
      success: true,
      data,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      page: pageNum,
    });
  } catch (err) {
    console.error("getCandidates error:", err);
    res.status(500).json({ success: false, message: "Failed to load candidates" });
  }
};