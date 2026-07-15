import { z } from "zod";

// Parsed once per "Rank by JD" click, then reused deterministically
// against every candidate — see services/candidateJdScorer.ts for why
// that split matters (same reasoning as the ATS score feature).
export const jdRequirementsSchema = z.object({
  roleTitle: z.string().trim().optional(),
  requiredSkills: z.array(z.string().trim()).default([]),
  niceToHaveSkills: z.array(z.string().trim()).default([]),
  minExperienceYears: z.number().min(0).default(0),
  preferredCertifications: z.array(z.string().trim()).default([]),
  // Short phrases describing core responsibilities — matched against
  // candidates' experience descriptions to catch relevant hands-on
  // work that isn't captured by the skills list alone (e.g. "led
  // Salesforce migrations", "built custom Apex triggers").
  responsibilityKeywords: z.array(z.string().trim()).default([]),
});

export type JdRequirements = z.infer<typeof jdRequirementsSchema>;