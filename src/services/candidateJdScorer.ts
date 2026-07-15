    import { JdRequirements } from "../models/jdRequirements";

export interface CandidateForScoring {
  salesforceSkills?: string[];
  skills?: string[];
  totalExperienceYears?: number;
  totalExperienceMonths?: number;
  certifications?: { name?: string }[];
  experience?: { title?: string; description?: string }[];
}

export interface ScoreResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Loose "does the candidate have this skill" check — substring match
// in both directions so "LWC" matches "LWC (Lightning Web Components)"
// and vice versa, without pulling in a full fuzzy-matching library for
// what's fundamentally still simple keyword overlap.
function candidateHasSkill(candidateSkillsLower: string[], required: string): boolean {
  const needle = normalize(required);
  return candidateSkillsLower.some((s) => s.includes(needle) || needle.includes(s));
}

// ── Weighted scoring ─────────────────────────────────────────
// Required skills matter most (this is what a real hiring manager
// screens on first), experience threshold second, nice-to-haves and
// responsibility-keyword overlap in experience descriptions round it
// out. Weights are deliberately simple percentages that sum to 100,
// not a machine-learned model — this needs to be explainable to a
// recruiter looking at why one candidate scored higher than another.
const WEIGHTS = {
  requiredSkills: 45,
  experience: 20,
  niceToHaveSkills: 10,
  certifications: 10,
  responsibilities: 15,
};

export function scoreCandidateAgainstJd(candidate: CandidateForScoring, req: JdRequirements): ScoreResult {
  const candidateSkillsLower = [...(candidate.salesforceSkills ?? []), ...(candidate.skills ?? [])].map(normalize);

  // Required skills
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const skill of req.requiredSkills) {
    (candidateHasSkill(candidateSkillsLower, skill) ? matchedSkills : missingSkills).push(skill);
  }
  const requiredSkillsScore = req.requiredSkills.length
    ? (matchedSkills.length / req.requiredSkills.length) * 100
    : 100;

  // Nice-to-have skills
  const niceMatched = req.niceToHaveSkills.filter((s) => candidateHasSkill(candidateSkillsLower, s));
  const niceToHaveScore = req.niceToHaveSkills.length ? (niceMatched.length / req.niceToHaveSkills.length) * 100 : 100;

  // Experience — full credit at or above the JD's minimum, partial
  // credit scaled linearly below it (a candidate at 80% of the
  // required years isn't zero-value, just not fully qualified yet).
  const candidateYears = (candidate.totalExperienceYears ?? 0) + (candidate.totalExperienceMonths ?? 0) / 12;
  const experienceScore =
    req.minExperienceYears > 0 ? Math.min(100, (candidateYears / req.minExperienceYears) * 100) : 100;

  // Certifications
  const candidateCertNames = (candidate.certifications ?? []).map((c) => normalize(c.name ?? ""));
  const certMatched = req.preferredCertifications.filter((c) =>
    candidateCertNames.some((cn) => cn.includes(normalize(c)) || normalize(c).includes(cn))
  );
  const certificationScore = req.preferredCertifications.length
    ? (certMatched.length / req.preferredCertifications.length) * 100
    : 100;

  // Responsibility keyword overlap — checked against each experience
  // entry's title + description, catching relevant hands-on work that
  // a plain skills list wouldn't surface.
  const experienceText = normalize(
    (candidate.experience ?? []).map((e) => `${e.title ?? ""} ${e.description ?? ""}`).join(" ")
  );
  const responsibilityMatches = req.responsibilityKeywords.filter((k) => experienceText.includes(normalize(k)));
  const responsibilityScore = req.responsibilityKeywords.length
    ? (responsibilityMatches.length / req.responsibilityKeywords.length) * 100
    : 100;

  const finalScore = Math.round(
    (requiredSkillsScore * WEIGHTS.requiredSkills +
      experienceScore * WEIGHTS.experience +
      niceToHaveScore * WEIGHTS.niceToHaveSkills +
      certificationScore * WEIGHTS.certifications +
      responsibilityScore * WEIGHTS.responsibilities) /
      100
  );

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    matchedSkills,
    missingSkills,
  };
}