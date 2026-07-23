// services/aiJobParser.service.ts
import geminiModel from "./gemini.service";
import { cleanJobDescription } from "../utils/cleanJobDescription";
import { GeneratedJobSchema, GeneratedJob } from "../validators/generatedJob.schema";

const SYSTEM_INSTRUCTION = `
You are an expert Salesforce recruiter and job analyst.
Your task is to read a raw job description and extract structured information from it.
Return ONLY a valid JSON object — no explanation, no markdown, no code fences.
If a field cannot be determined from the JD, return null for that field.
`.trim();

function buildPrompt(jd: string): string {
  return `
${SYSTEM_INSTRUCTION}

Extract the following fields from the job description below and return ONLY a JSON object matching this exact structure:

{
  "title":            string — job title,
  "companyName":      string | null — company name if mentioned,
  "companyLogo":      null,
  "location":         string | null — city and country e.g. "Hyderabad, India",
  "country":          string | null — country only e.g. "India",
  "workMode":         "Remote" | "Hybrid" | "Onsite" | null,
  "employmentType":   "Full-time" | "Part-time" | "Contract" | "Internship" | null,
  "experienceLevel":  "0 Years"|"1-2 Years"|"2-6 Years"|"6-8 Years"|"8-12 Years"|"12+ Years" | null,
  "roleCategory":     string | null — e.g. "Salesforce Developer", "Salesforce Administrator",
  "salaryMin":        number | null,
  "salaryMax":        number | null,
  "currency":         string | null — e.g. "INR", "USD",
  "skills":           string[] — Only technical skills,
  "certifications":   string[] — Salesforce certifications mentioned,
  "responsibilities": string[] — key responsibilities as bullet points,
  "requirements":     string[] — key requirements as bullet points,
  "benefits":         string[] — perks or benefits mentioned,
  "description":      string — a clean 2-3 paragraph summary of the role,
  "applyUrl":         string | null — application URL if mentioned
}

Rules:
- experienceLevel: map years to level (0-1yr=Fresher, 1-3yr=Associate, 3-5yr=Mid, 5-8yr=Senior, 8+yr=Lead)
- workMode: infer from keywords like "work from home"=Remote, "on-site"=Onsite
- skills: include Salesforce-specific skills like Apex, LWC, SOQL, Flow, CPQ etc.
- description: write a clean professional summary, not copy-paste from the JD
- Return ONLY the JSON object, nothing else — no markdown fences, no commentary.

Job Description:
${jd}
`.trim();
}

export async function parseJobDescription(
        jd:string
    ):Promise<GeneratedJob>{
    jd = cleanJobDescription(jd);
  if (!jd || jd.trim().length < 50) {
    throw Object.assign(
      new Error("Job description is too short. Please provide a more detailed JD."),
      { status: 400 }
    );
  }

  const result   = await geminiModel.generateContent(buildPrompt(jd));
  const response = result.response;
  const raw      = response.text();

  if (!raw) throw new Error("AI returned an empty response.");

  // Gemini occasionally wraps JSON in ```json fences despite instructions — strip them defensively
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  const validated = GeneratedJobSchema.safeParse(parsed);
  if (!validated.success) {
    const issues = validated.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`AI response validation failed: ${issues}`);
  }

  return validated.data;
}