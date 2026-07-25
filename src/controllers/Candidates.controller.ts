import { Request, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import Profile from "../models/Profile";
import User from "../models/User";

// ── GET /api/candidates ──────────────────────────────────────
// Recruiter/admin-only candidate search. Joins Profile with User
// (via aggregation, not populate) so we can filter/search across
// both collections and paginate correctly in one query — populate()
// would require filtering in application code after fetching a page,
// which breaks pagination math the moment a filter excludes rows.
//
// Query params:
//   q               — global search: name, headline, designation, company, skills
//   skills          — comma-separated, matches salesforceSkills OR skills
//   minExp, maxExp  — total years of experience range
//   noticePeriod    — exact match: immediate | 15_days | 30_days | 60_days | 90_days | other
//   employmentType  — exact match: full_time | part_time | contract | internship | freelance
//   country         — exact match on location.country
//   city            — partial match on location.city
//   relocate        — "true" to only show willingToRelocate
//   hasResume       — "true" to only show candidates who uploaded a resume
//   page, limit     — pagination
export const getCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      q = "",
      skills = "",
      minExp,
      maxExp,
      noticePeriod,
      employmentType,
      country,
      city,
      relocate,
      hasResume,
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    const matchStage: Record<string, any> = {
      isPublicToRecruiters: true,
      "userInfo.role": "user",
    };

    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        const skillRegexes = skillList.map((s) => new RegExp(s, "i"));
        matchStage.$or = [
          { salesforceSkills: { $in: skillRegexes } },
          { skills: { $in: skillRegexes } },
        ];
      }
    }

    if (minExp || maxExp) {
      matchStage.totalExperienceYears = {
        ...(minExp ? { $gte: Number(minExp) } : {}),
        ...(maxExp ? { $lte: Number(maxExp) } : {}),
      };
    }

    if (noticePeriod) matchStage.noticePeriod = noticePeriod;
    if (employmentType) matchStage.employmentType = employmentType;
    if (country) matchStage["location.country"] = country;
    if (city) matchStage["location.city"] = new RegExp(city, "i");
    if (relocate === "true") matchStage.willingToRelocate = true;
    if (hasResume === "true") matchStage["resume.url"] = { $exists: true, $ne: null };

    // Global search — separate $match so it can combine with the
    // skills $or above via $and instead of overwriting it.
    const searchStage: mongoose.PipelineStage[] = [];
    if (q.trim()) {
      const re = new RegExp(q.trim(), "i");
      searchStage.push({
        $match: {
          $or: [
            { headline: re },
            { currentDesignation: re },
            { currentCompany: re },
            { salesforceSkills: re },
            { skills: re },
            { "userInfo.name": re },
          ],
        },
      });
    }

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
    // console.error("getCandidates error:", err);
    res.status(500).json({ success: false, message: "Failed to load candidates" });
  }
};