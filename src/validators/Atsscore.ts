import { z } from "zod";

// Gemini is only asked for the *qualitative* judgment here — keyword
// matching itself is computed deterministically in code (see
// services/atsScorer.ts) since that's how real ATS systems actually
// work, and it's not something worth trusting an LLM to compute
// consistently.
export const atsQualitativeSchema = z.object({
  qualityScore: z.number().min(0).max(100),
  strengths: z.array(z.string().trim()).max(6),
  gaps: z.array(z.string().trim()).max(6),
  suggestions: z.array(z.string().trim()).max(6),
  summary: z.string().trim().max(400),
});

export type AtsQualitative = z.infer<typeof atsQualitativeSchema>;