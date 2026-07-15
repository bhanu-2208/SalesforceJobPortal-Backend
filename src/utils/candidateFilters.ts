import mongoose from "mongoose";

// Extracted from controllers/candidatesController.ts so the "Rank by
// JD" endpoint can apply the exact same skills/experience/notice/etc.
// filters the recruiter already has active on the candidates page,
// without duplicating (and risking drifting) this logic in two places.
export function buildCandidateMatchStage(query: Record<string, string>): {
  matchStage: Record<string, unknown>;
  searchStage: mongoose.PipelineStage[];
} {
  const { q = "", skills = "", minExp, maxExp, noticePeriod, country, city, relocate, hasResume } = query;

  const matchStage: Record<string, unknown> = {
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
  if (country) matchStage["location.country"] = country;
  if (city) matchStage["location.city"] = new RegExp(city, "i");
  if (relocate === "true") matchStage.willingToRelocate = true;
  if (hasResume === "true") matchStage["resume.url"] = { $exists: true, $ne: null };

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

  return { matchStage, searchStage };
}