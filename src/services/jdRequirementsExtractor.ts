import { GoogleGenerativeAI } from "@google/generative-ai";
import { jdRequirementsSchema, JdRequirements } from "../models/jdRequirements";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const JD_PROMPT = `You are analyzing a job description for a Salesforce jobs platform.
Extract structured hiring requirements from it.

Return ONLY raw JSON — no markdown fences, no commentary — in this shape:
{
  "roleTitle": string,
  "requiredSkills": string[],          // must-have technical/Salesforce skills (Apex, LWC, Flow, Integration, etc.)
  "niceToHaveSkills": string[],        // skills mentioned as a plus but not mandatory
  "minExperienceYears": number,        // minimum years of experience required; 0 if not specified
  "preferredCertifications": string[], // named certifications mentioned (e.g. "Salesforce Certified Administrator")
  "responsibilityKeywords": string[]   // 5-10 short phrases describing core day-to-day responsibilities, used to match against candidates' work history descriptions
}

Job description:
"""
{{JD_TEXT}}
"""`;

function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
}

export async function extractJdRequirements(jdText: string): Promise<JdRequirements> {
  if (!jdText || jdText.trim().length < 30) {
    throw new Error("That job description looks too short to analyze — please paste the full JD.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = JD_PROMPT.replace("{{JD_TEXT}}", jdText.slice(0, 8000));

  const result = await model.generateContent(prompt);
  const jsonText = stripCodeFences(result.response.text());

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new Error("AI returned an unreadable response — please try again.");
  }

  const validated = jdRequirementsSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error("AI response didn't match the expected format.");
  }
  return validated.data;
}