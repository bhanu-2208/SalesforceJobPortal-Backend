import { GoogleGenerativeAI } from "@google/generative-ai";
import { atsQualitativeSchema, AtsQualitative } from "../validators/Atsscore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export interface AtsResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  summary: string;
}

// ── Step 1: deterministic keyword matching ───────────────────
// Real ATS software matches on literal keyword presence, not on an
// AI's "vibe" of whether a resume is relevant — so this part is
// plain string matching against the job's own `skills[]` array
// (already structured data set by whoever posted the job), not an
// AI guess. Case-insensitive, tolerant of "LWC" vs "Lightning Web
// Components"-style near-misses is intentionally NOT attempted here;
// keeping this simple and literal is what makes the score trustworthy
// and reproducible.
function matchKeywords(resumeText: string, jobSkills: string[]): { matched: string[]; missing: string[] } {
  const haystack = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jobSkills) {
    const needle = skill.trim().toLowerCase();
    if (!needle) continue;
    if (haystack.includes(needle)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, missing };
}

// ── Step 2: Gemini's qualitative pass ─────────────────────────
// This only judges things a keyword match can't: is the experience
// described with impact/metrics, is the resume well-targeted to this
// specific role, what should be added or reworded. It does NOT
// re-decide which keywords matched — that list is handed to it as
// already-known fact, so it can't contradict the deterministic count.
const ATS_PROMPT = `You are an ATS (Applicant Tracking System) resume reviewer for a
Salesforce jobs platform. You will be given a candidate's resume text,
a job description, and two keyword lists that have ALREADY been
computed by matching the resume against the job's required skills —
do not recompute or contradict these lists.

Matched skills (already found in the resume): {{MATCHED}}
Missing skills (required by the job, not found in the resume): {{MISSING}}

Based on the full resume and job description below, return ONLY raw
JSON (no markdown fences, no commentary) in this shape:
{
  "qualityScore": number,      // 0-100, how well-written/targeted the resume is for THIS role, independent of the keyword list above
  "strengths": string[],       // up to 6 short bullet points, what's genuinely strong about this resume for this role
  "gaps": string[],            // up to 6 short bullet points, weaknesses beyond just missing keywords (e.g. no metrics, vague descriptions, poor structure)
  "suggestions": string[],     // up to 6 concrete, actionable rewrites/additions
  "summary": string            // 1-2 sentence overall verdict
}

Job description:
"""
{{JOB_DESCRIPTION}}
"""

Resume:
"""
{{RESUME_TEXT}}
"""`;

function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
}

async function getQualitativeAssessment(
  resumeText: string,
  jobDescription: string,
  matched: string[],
  missing: string[]
): Promise<AtsQualitative> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = ATS_PROMPT
    .replace("{{MATCHED}}", matched.join(", ") || "none")
    .replace("{{MISSING}}", missing.join(", ") || "none")
    .replace("{{JOB_DESCRIPTION}}", jobDescription.slice(0, 6000))
    .replace("{{RESUME_TEXT}}", resumeText.slice(0, 15000));

  const result = await model.generateContent(prompt);
  const jsonText = stripCodeFences(result.response.text());

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new Error("AI returned an unreadable response — please try again.");
  }

  const validated = atsQualitativeSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error("AI response didn't match the expected format.");
  }
  return validated.data;
}

// ── Step 3: combine into one score ────────────────────────────
// 65% deterministic keyword coverage + 35% AI qualitative score.
// Keyword coverage is weighted higher because that's what real ATS
// filtering actually gates on — the AI portion adds the "is this
// resume well-written for this specific role" nuance on top.
export async function runAtsCheck(resumeText: string, jobDescription: string, jobSkills: string[]): Promise<AtsResult> {
  const { matched, missing } = matchKeywords(resumeText, jobSkills);

  const keywordScore = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 100;

  const qualitative = await getQualitativeAssessment(resumeText, jobDescription, matched, missing);

  const finalScore = Math.round(keywordScore * 0.65 + qualitative.qualityScore * 0.35);

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    matchedKeywords: matched,
    missingKeywords: missing,
    strengths: qualitative.strengths,
    gaps: qualitative.gaps,
    suggestions: qualitative.suggestions,
    summary: qualitative.summary,
  };
}