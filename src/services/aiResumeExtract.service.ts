import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiParsedResumeSchema, AiParsedResume } from "../models/aiParsedResume";

// Uses your existing @google/generative-ai dependency — same one your
// "Generate with AI" job-description feature already uses. Gemini's
// flash model has a free tier (generous request/token limits at the
// time of writing), so this adds no paid service.
//
// Requires GEMINI_API_KEY in your .env (get one free at
// https://aistudio.google.com/apikey).

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const RESUME_PROMPT = `You are a resume-parsing engine for a Salesforce jobs platform.
Read the resume text below and extract structured data.

Return ONLY raw JSON — no markdown code fences, no commentary, no
explanation before or after. If a field isn't present in the resume,
omit it entirely rather than guessing.

JSON shape to return:
{
  "headline": string,               // e.g. "Salesforce Developer | 3+ yrs | Apex, LWC"
  "summary": string,                // 2-4 sentence professional summary
  "phone": string,
  "location": { "city": string, "state": string, "country": string },
  "currentDesignation": string,
  "currentCompany": string,
  "totalExperienceYears": number,
  "totalExperienceMonths": number,
  "salesforceSkills": string[],     // Apex, LWC, Flow, Integration, Data Cloud, Trailhead badges mentioned, etc.
  "skills": string[],               // any other technical/soft skills
  "languages": string[],
  "trailheadUrl": string,
  "experience": [
    {
      "title": string,
      "company": string,
      "location": string,
      "from": "YYYY-MM",
      "to": "YYYY-MM",              // omit if this is their current role
      "current": boolean,
      "description": string
    }
  ],
  "education": [
    { "degree": string, "institution": string, "startYear": number, "endYear": number, "grade": string }
  ],
  "certifications": [
    { "name": string, "issuer": string, "issueDate": "YYYY-MM", "credentialId": string, "credentialUrl": string }
  ],
  "links": { "linkedin": string, "github": string, "portfolio": string, "leetcode": string, "stackoverflow": string }
}

Resume text:
"""
{{RESUME_TEXT}}
"""`;

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function parseResumeText(resumeText: string): Promise<AiParsedResume> {
  if (!resumeText || resumeText.trim().length < 30) {
    throw new Error("Couldn't read enough text from that resume to parse it.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Cap input length defensively — very long resumes/CVs with embedded
  // junk shouldn't blow the context window or cost more than necessary.
  const trimmedText = resumeText.slice(0, 15000);

  const prompt = RESUME_PROMPT.replace("{{RESUME_TEXT}}", trimmedText);

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  const jsonText = stripCodeFences(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new Error("AI returned an unreadable response — please try again.");
  }

  const validated = aiParsedResumeSchema.safeParse(parsedJson);
  if (!validated.success) {
    // Don't throw away a partially-good parse over one bad field —
    // strip anything that failed validation and keep the rest where
    // possible. For simplicity here we still fail closed; tighten
    // later if you want best-effort partial merges.
    throw new Error("AI response didn't match the expected resume format.");
  }

  return validated.data;
}