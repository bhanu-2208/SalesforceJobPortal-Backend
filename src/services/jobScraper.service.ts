import Job     from "../models/Job";
import Company from "../models/Company";
import geminiModel from "./gemini.service";
import { isGenuineSalesforceJob, scoreSalesforceRelevance } from "./salesforceScorer";
import { fetchFromGreenhouse } from "../importers/greenhouse.importer"
import { fetchFromLever }      from "../importers/lever.importer";
import User from "../models/User";
import { ExperienceLevel } from "../models/Job";
import { Types } from "mongoose";
import { fetchFromAshby } from "../importers/ashby.importer";
import { fetchFromSmartRecruiters } from "../importers/smartrecruiters.importer";
import { fetchFromTeamtailor } from "../importers/teamtailor.importer";

function convertExperienceLevel(
    aiLevel: string | null
): ExperienceLevel {

    switch (aiLevel) {
        case "Intern":
            return "0 Years";

        case "Fresher":
            return "0 Years";

        case "Associate":
            return "1-2 Years";

        case "Mid":
            return "2-6 Years";

        case "Senior":
            return "6-8 Years";

        case "Lead":
            return "8-12 Years";

        default:
            return "2-6 Years";
    }
}

interface RawExternalJob {
  sourceId: string; source: string; title: string; companyName: string;
  location?: string; description: string; applyUrl: string; postedAt?: string;
}

// ── Remotive (free, no key) ──────────────────────────────────────────
async function fetchFromRemotive(): Promise<RawExternalJob[]> {
  const res = await fetch("https://remotive.com/api/remote-jobs?search=salesforce");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    sourceId: `remotive-${j.id}`, source: "Remotive", title: j.title,
    companyName: j.company_name, location: j.candidate_required_location,
    description: j.description?.replace(/<[^>]+>/g, " ").slice(0, 4000) ?? "",
    applyUrl: j.url, postedAt: j.publication_date,
  }));
}

// ── Arbeitnow (free, no key) ──────────────────────────────────────────
async function fetchFromArbeitnow(): Promise<RawExternalJob[]> {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || [])
    .filter((j: any) => j.title?.toLowerCase().includes("salesforce") || j.description?.toLowerCase().includes("salesforce"))
    .map((j: any) => ({
      sourceId: `arbeitnow-${j.slug}`, source: "Arbeitnow", title: j.title,
      companyName: j.company_name, location: j.location,
      description: j.description?.replace(/<[^>]+>/g, " ").slice(0, 4000) ?? "",
      applyUrl: j.url, postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
    }));
}

// ── AI enrichment ─────────────────────────────────────────────────────
async function enrichWithAI(raw: RawExternalJob) {
  const prompt = `
You are a Salesforce recruiter. Read this job posting and return ONLY a JSON object:
{
  "workMode": "Remote" | "Hybrid" | "Onsite" | null,
  "experienceLevel": "Intern" | "Fresher" | "Associate" | "Mid" | "Senior" | "Lead" | null,
  "roleCategory": string | null,
  "skills": string[],
  "employmentType": "Full-time" | "Part-time" | "Contract" | "Internship" | null,
  "description": string (clean 2-3 paragraph summary)
}
Job Title: ${raw.title}
Company: ${raw.companyName}
Location: ${raw.location ?? "Not specified"}
Description:
${raw.description}
`.trim();

  try {
    const result = await geminiModel.generateContent(prompt);
    const cleaned = result.response.text().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { workMode: null, experienceLevel: null, roleCategory: "Salesforce", skills: ["Salesforce"], employmentType: "Full-time", description: raw.description.slice(0, 500) };
  }
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ── Main import — now with real Salesforce filtering ──────────────────
export async function runJobImport(): Promise<{ imported: number; skipped: number; rejected: number; errors: number }> {
  console.log("🔄  Starting scheduled Salesforce job import…");

  const [remotive, arbeitnow, greenhouse, lever, ashby, smartRecruiters, teamtailor] = await Promise.all([
    fetchFromRemotive().catch(() => []),
    fetchFromArbeitnow().catch(() => []),
    fetchFromGreenhouse().catch(() => []),
    fetchFromLever().catch(() => []),
    fetchFromAshby().catch(() => []),
    fetchFromSmartRecruiters().catch(() => []),
    fetchFromTeamtailor().catch(() => []),
  ]);

  // Temporary visibility into what each source is actually returning.
  // Safe to remove once you've confirmed all sources are healthy.
  console.log("Per-source counts:", {
    remotive: remotive.length,
    arbeitnow: arbeitnow.length,
    greenhouse: greenhouse.length,
    lever: lever.length,
    ashby: ashby.length,
    smartRecruiters: smartRecruiters.length,
    teamtailor: teamtailor.length,
  });

  const MAX_JOBS = 500;

  // Combine ALL seven sources (previously ashby/smartRecruiters/teamtailor
  // were fetched but never included here, so they were silently discarded).
  const allRawJobs: RawExternalJob[] = [
    ...remotive,
    ...arbeitnow,
    ...greenhouse,
    ...lever,
    ...ashby,
    ...smartRecruiters,
    ...teamtailor,
  ];

  // SCORE, filter out weak matches, then sort by recency
  const scored = allRawJobs
    .map(job => ({ job, score: scoreSalesforceRelevance(job) }))
    .filter(({ score }) => score >= 15) // MIN_SALESFORCE_SCORE
    .sort((a, b) => {
      const dateA = a.job.postedAt ? new Date(a.job.postedAt).getTime() : 0;
      const dateB = b.job.postedAt ? new Date(b.job.postedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, MAX_JOBS);

  let imported = 0, skipped = 0, rejected = 0, errors = 0;
  const totalFetched = allRawJobs.length;
  rejected = totalFetched - scored.length;

  for (const { job: raw, score } of scored) {
    try {
      const existing = await Job.findOne({ sourceId: raw.sourceId });
      if (existing) { skipped++; continue; }

      let company = await Company.findOne({ name: { $regex: `^${raw.companyName.trim()}$`, $options: "i" } });
      if (!company) {
        company = await Company.create({ name: raw.companyName.trim(), jobCount: 1 });
      } else {
        await Company.findByIdAndUpdate(company._id, { $inc: { jobCount: 1 } });
      }

      const enriched = await enrichWithAI(raw);
      const systemUser = await User.findOne({ email: "talentcloud360@gmail.com" });
      await Job.create({
        title: raw.title,
        slug: slugify(`${raw.title}-${raw.companyName}-${raw.sourceId}`),
        description: enriched.description || raw.description,
        location: raw.location,
        workMode: enriched.workMode,
        experienceLevel: convertExperienceLevel(
          enriched.experienceLevel
        ),
        roleCategory: enriched.roleCategory,
        skills: enriched.skills || [],
        employmentType: enriched.employmentType,
        applyUrl: raw.applyUrl,
        source: raw.source,
        postedBy: systemUser!._id,
        sourceId: raw.sourceId,
        postedAt: raw.postedAt ? new Date(raw.postedAt) : new Date(),
        company: company._id as Types.ObjectId,
      });

      imported++;
    } catch (err) {
      console.error(`❌  Failed to import "${raw.title}":`, err);
      errors++;
    }
  }

  console.log(`✅  Import complete — ${imported} imported, ${skipped} duplicates, ${rejected} rejected (low relevance), ${errors} errors`);
  return { imported, skipped, rejected, errors };
}