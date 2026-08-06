
import Job from "../models/Job";
import { getFullDescription } from "./jobExtraction.service";
import Company from "../models/Company";
import User from "../models/User";
// import geminiModel from "./gemini.service";
import groq from "./groq.service";
import {enrich} from "./aiProvider.service"

import { ExperienceLevel } from "../models/Job";

import { evaluateSalesforceJob } from "./salesforceFilter";

import { fetchCompanyJobs } from "./atsJob.service";
import { cleanHTML } from "../utils/htmlcleaner";


let isImportRunning = false;
interface RawExternalJob {
  sourceId: string;
  source: string;

  title: string;
  companyName: string;

  description: string;

  location?: string;
  applyUrl: string;
  postedAt?: string;
}

interface AIEnrichment {
  workMode: "Remote" | "Hybrid" | "Onsite" | null;

  experienceLevel:
    | "0 Years"| "1-2 Years"| "2-6 Years"| "6-8 Years"| "8-12 Years"| "12+ Years"
    | null;

  roleCategory: string | null;

  skills: any;

  employmentType:
    | "Full-time"
    | "Part-time"
    | "Contract"
    | "Internship"
    | null;

  overview:                string;
  cleanDescription:        string;
  responsibilities:        string[];
  requirements:            string[];
  preferredQualifications: string[];
  benefits:                string[];
  salesforceProducts:      string[];
  certifications:          string[];


}

interface ImportStats {
  imported: number;
  skipped: number;
  rejected: number;
  errors: number;
}

const MAX_IMPORTS = 50;

const COMPANY_CACHE = new Map<string, any>();

const SYSTEM_USER_EMAIL = "talentcloud360@gmail.com";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeSkills(skills: any): string[] {

  if (!skills) return [];


  // Already flat array
  if (
    Array.isArray(skills) &&
    skills.every(skill => typeof skill === "string")
  ) {
    return skills;
  }


  // Gemini category object inside array
  if (
    Array.isArray(skills) &&
    typeof skills[0] === "object"
  ) {

    return Object.values(skills[0])
      .flat()
      .filter(
        (skill): skill is string =>
          typeof skill === "string"
      );
  }


  // Gemini object directly
  if (
    typeof skills === "object"
  ) {

    return Object.values(skills)
      .flat()
      .filter(
        (skill): skill is string =>
          typeof skill === "string"
      );
  }


  return [];
}

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

// ─────────────────────────────────────────────────────────────
// FREE JOB SOURCES
// ─────────────────────────────────────────────────────────────

async function fetchFromRemotive(): Promise<RawExternalJob[]> {
  try {
    const res = await fetch(
      "https://remotive.com/api/remote-jobs?search=salesforce"
    );

    if (!res.ok) return [];

    const data = await res.json();

    return (data.jobs || []).map((job: any) => ({
      sourceId: `remotive-${job.id}`,
      source: "Remotive",

      title: job.title,
      companyName: job.company_name,

      description:
        // job.description
          // ?.replace(/<[^>]+>/g, " ")
          // .replace(/\s+/g, " ")
          // .trim(),
          cleanHTML(job.description),
      location: job.candidate_required_location,

      applyUrl: job.url,

      postedAt: job.publication_date,
    }));
  } catch {
    return [];
  }
}

async function fetchFromArbeitnow(): Promise<RawExternalJob[]> {
  try {
    const res = await fetch(
      "https://www.arbeitnow.com/api/job-board-api"
    );

    if (!res.ok) return [];

    const data = await res.json();

    return (data.data || [])
      .filter((job: any) => {
        const text =
          `${job.title} ${job.description}`.toLowerCase();

        return text.includes("salesforce");
      })
      .map((job: any) => ({
        sourceId: `arbeitnow-${job.slug}`,

        source: "Arbeitnow",

        title: job.title,

        companyName: job.company_name,

        description:
          // job.description
          //   // ?.replace(/<[^>]+>/g, " ")
          //   .replace(/\s+/g, " ")
          //   .trim(),
          cleanHTML(job.description),

        location: job.location,

        applyUrl: job.url,

        postedAt: job.created_at
          ? new Date(job.created_at * 1000).toISOString()
          : undefined,
      }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// AI ENRICHMENT
// Runs ONLY after Salesforce rule engine accepts the job.
// Saves Gemini requests and money.
// ─────────────────────────────────────────────────────────────

// async function enrichWithAI(
//     raw: RawExternalJob
// ): Promise<AIEnrichment>{


// const prompt = `

// You are an expert Salesforce technical recruiter and job data extraction engine.

// You work for a Salesforce-focused job marketplace.

// Your task is to analyze raw ATS job data and convert it into a clean structured JSON record.

// Your output will be directly stored in MongoDB.

// Accuracy is more important than completeness.

// NEVER invent information.

// ================================================
// JOB INPUT
// ================================================

// Title:
// ${raw.title}

// Company:
// ${raw.companyName}

// Location:
// ${raw.location ?? "Unknown"}

// Job Description:

// ${raw.description.slice(0, 8000)}


// ================================================
// STRICT OUTPUT RULES
// ================================================

// Return ONLY valid JSON.

// Do not use markdown.

// Do not add explanations.

// Do not wrap JSON inside code blocks.

// All missing information must be:

// Arrays:
// []

// Unknown values:
// null


// ================================================
// OUTPUT JSON FORMAT
// ================================================

// {
// "title": "",
// "normalizedTitle": "",

// "roleCategory": "",


// "seniority": 
// "Intern" |
// "Fresher" |
// "Associate" |
// "Mid" |
// "Senior" |
// "Lead" |
// null,


// "experienceLevel":
// {
// "minYears": null,
// "maxYears": null
// },


// "workMode":
// "Remote" |
// "Hybrid" |
// "Onsite" |
// null,


// "employmentType":
// "Full-time" |
// "Part-time" |
// "Contract" |
// "Internship" |
// null,


// "skills": [],


// "salesforceExpertise":
// {
// "products": [],
// "development": [],
// "administration": [],
// "automation": [],
// "data": [],
// "integrations": [],
// "testing": [],
// "certifications": []
// },


// "programmingSkills": [],


// "cloudSkills": [],


// "databaseSkills": [],


// "devopsSkills": [],


// "tools": [],


// "responsibilities": [],


// "requirements": [],


// "niceToHave": [],


// "description": ""

// }


// ================================================
// EXTRACTION RULES
// ================================================


// TITLE NORMALIZATION:

// Convert vague titles into Salesforce-specific professional titles.

// Examples:


// Input:
// CRM Developer

// Output:
// Salesforce Developer


// Input:
// Business Systems Engineer II

// Output:
// Salesforce Business Systems Engineer


// Input:
// Application Engineer

// Output:
// Salesforce Application Engineer


// Do not change the seniority level.

// ================================================


// SALESFORCE SKILL EXTRACTION
// ================================================

// Extract ONLY Salesforce-related technologies explicitly mentioned or clearly required.


// Development:

// Apex
// Lightning Web Components
// Aura Components
// Visualforce
// SOQL
// SOSL
// Triggers
// Batch Apex
// Queueable Apex
// REST API
// SOAP API
// Salesforce DX
// Salesforce CLI


// Automation:

// Salesforce Flow
// Flow Builder
// Process Builder
// Workflow Rules
// Approval Processes


// Administration:

// Salesforce Administration
// Profiles
// Permission Sets
// Roles
// Sharing Rules
// Reports
// Dashboards
// Security Model


// Salesforce Clouds:

// Sales Cloud
// Service Cloud
// Experience Cloud
// Marketing Cloud
// Commerce Cloud
// Data Cloud
// CPQ
// Field Service


// Data:

// Data Loader
// Data Import Wizard
// Data Migration
// ETL


// Testing:

// Apex Testing
// Test Classes
// Code Coverage


// ================================================
// PROGRAMMING SKILLS
// ================================================

// Extract only if mentioned:

// Java
// JavaScript
// TypeScript
// Python
// C#
// SQL
// HTML
// CSS


// ================================================
// CLOUD / DEVOPS
// ================================================

// Extract only if mentioned:

// AWS
// Azure
// GCP
// Docker
// Kubernetes
// CI/CD
// GitHub Actions
// Jenkins
// Terraform


// ================================================
// DATABASE
// ================================================

// Extract only if mentioned:

// MongoDB
// PostgreSQL
// MySQL
// Oracle
// Redis
// SQL Server


// ================================================
// TOOLS
// ================================================

// Extract:

// Jira
// Git
// GitHub
// Bitbucket
// VS Code
// Postman
// MuleSoft
// Copado
// Gearset


// ================================================
// SKILL RULES
// ================================================

// VERY IMPORTANT:

// 1. Never infer skills from job title alone.

// Example:

// "Salesforce Developer"

// Does NOT automatically mean:

// Apex
// LWC
// SOQL

// Only include them if mentioned.


// 2. Do not include generic words as technical skills.

// Do NOT include:

// Communication
// Leadership
// Problem solving
// Teamwork
// Agile


// unless they appear under requirements.


// 3. Remove duplicates.


// 4. Keep exact technology names.


// ================================================
// RESPONSIBILITIES
// ================================================

// Convert job responsibilities into short professional bullet points.

// Example:

// Bad:

// Responsible for Salesforce development activities.


// Good:

// [
// "Develop Salesforce applications using Apex and Lightning components",
// "Build integrations using REST APIs"
// ]


// ================================================
// REQUIREMENTS
// ================================================

// Extract required qualifications.

// Examples:

// [
// "3+ years Salesforce development experience",
// "Apex programming experience",
// "Salesforce Platform Developer certification"
// ]


// ================================================
// DESCRIPTION GENERATION
// ================================================

// Create a recruiter-friendly job summary.

// Rules:

// - 2 short paragraphs
// - Do not copy original sentences
// - Mention role purpose
// - Mention Salesforce technologies
// - Mention expected experience
// - Keep professional tone


// ================================================
// FINAL VALIDATION BEFORE RESPONSE
// ================================================

// Before returning JSON verify:

// ✓ Valid JSON syntax
// ✓ No markdown
// ✓ No comments
// ✓ No invented skills
// ✓ All arrays contain strings only
// ✓ skills field is always a flat array


// `;



// try{


// const result =
// await geminiModel.generateContent(prompt);



// const cleaned =
// result.response.text()
// .replace(/^```json/i,"")
// .replace(/```$/i,"")
// .trim();



// return JSON.parse(cleaned);



// }
// catch (error: any) {
//     console.error(
//         `AI parsing failed for ${raw.title}: ${error?.message || error}`
//     );

//     return {
//         workMode: null,
//         experienceLevel: null,
//         roleCategory: "Salesforce",
//         skills: ["Salesforce"],
//         employmentType: "Full-time",
//         description: raw.description,
//     };
// }

function formatDescription(description: string): string {
  if (!description) return "";

  // Remove HTML
  let text = cleanHTML(description);

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  // Remove excessive spaces
  text = text.replace(/[ \t]+/g, " ");

  // Remove more than 2 consecutive newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // Split into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Group 4 sentences per paragraph
  const paragraphs: string[] = [];

  for (let i = 0; i < sentences.length; i += 4) {
    paragraphs.push(sentences.slice(i, i + 4).join(" "));
  }

  return paragraphs.join("\n\n").trim();
}
// }
async function enrichWithAI(raw: RawExternalJob, fullDescription: string): Promise<AIEnrichment> {
  const prompt = `
Rewrite the job posting into structured recruiter content.

VERY IMPORTANT:

The JSON fields have different purposes.

overview:
- 2-3 sentence company/role introduction.

cleanDescription:
- A readable introduction to the role.
- Do NOT include headings.
- Do NOT include Responsibilities.
- Do NOT include Requirements.
- Do NOT include Preferred Qualifications.
- Do NOT include Benefits.
- Do NOT include Certifications.
- Maximum 4 paragraphs.

responsibilities:
- Extract EVERY responsibility separately.

requirements:
- Extract EVERY required qualification separately.

preferredQualifications:
- Extract EVERY preferred qualification separately.

benefits:
- Extract every benefit separately.

skills:
- Technical skills only.

salesforceProducts:
- Salesforce products only.

certifications:
- Salesforce certifications only.

Rules:
- Do NOT summarize. Do NOT shorten.
- Preserve every requirement, responsibility, qualification, technology, and certification mentioned.
- Remove duplicate sentences and HTML.
- Improve grammar and formatting.
- Keep all information — completeness matters more than brevity.
- Return clean, professional English.

Then extract structured data and return ONLY this JSON object, nothing else:
{
  "overview": string (2-3 sentence company/role intro),
  "cleanDescription": string

Rules for cleanDescription:

- Include ONLY the introduction and overview of the role.
- Maximum 2-4 short paragraphs.
- Do NOT include headings.
- Do NOT include:
  - Responsibilities
  - Requirements
  - Preferred Qualifications
  - Benefits
  - Certifications
  - Skills
- Those must ONLY appear in their respective arrays.
  "responsibilities": string[] (every responsibility mentioned, one per item),
  "requirements": string[] (every required skill/experience, one per item),
  "preferredQualifications": string[] (nice-to-have items, one per item),
  "benefits": string[] (perks/benefits mentioned, empty array if none),
  "skills": string[] (technical skills/tools mentioned),
  "salesforceProducts": string[] (Salesforce clouds/products mentioned — Sales Cloud, Apex, LWC, etc. — empty array if none),
  "certifications": string[] (certifications mentioned, empty array if none),
 workMode:
- Return "Remote" if explicitly mentioned.
- Return "Hybrid" if explicitly mentioned.
- If neither Remote nor Hybrid is mentioned, return "Onsite".
- Never return null.
  "experienceLevel": "Intern" | "Fresher" | "Associate" | "Mid" | "Senior" | "Lead" | null,
  "roleCategory": string | null,
  "employmentType": "Full-time" | "Part-time" | "Contract" | "Internship" | null
}

Job Title: ${raw.title}
Company: ${raw.companyName}
Location: ${raw.location ?? "Not specified"}

Full Job Posting:
${fullDescription}
`.trim();

  try {
    // const result = await geminiModel.generateContent(prompt);
    // const raw = result.response.text();
    const response = await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      temperature: 0.1,

      response_format: {
          type: "json_object",
      },

      messages: [
          {
              role: "user",
              content: prompt,
          }
        ]
    });

    const raw = response.choices[0].message.content ?? "";

    console.log("\n================ GEMINI RAW RESPONSE ================\n");
    console.log(raw);
    console.log("\n=====================================================\n");

    const cleaned = raw
      .replace(/^\`\`\`json\s*/i, "")
      .replace(/\`\`\`\s*$/i, "")
      .trim();

    console.log("\n================ CLEANED JSON ========================\n");
    console.log(cleaned);
    console.log("\n=====================================================\n");

    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error("Gemini Error:");
    console.error(error);

    return {
        overview: "",
        cleanDescription: formatDescription(fullDescription),
        responsibilities: [],
        requirements: [],
        preferredQualifications: [],
        benefits: [],
        skills: ["Salesforce"],
        salesforceProducts: [],
        certifications: [],
        workMode: "Onsite",
        experienceLevel: null,
        roleCategory: "Salesforce",
        employmentType: "Full-time",
    };
}
}

// ─────────────────────────────────────────────────────────────
// DATABASE HELPERS
// ─────────────────────────────────────────────────────────────

async function getSystemUser() {
  const user = await User.findOne({
    email: SYSTEM_USER_EMAIL,
  });

  if (!user) {
    throw new Error(
      `System user "${SYSTEM_USER_EMAIL}" not found.`
    );
  }

  return user;
}

async function getCompany(companyName: string) {
  const key = companyName.trim().toLowerCase();

  if (COMPANY_CACHE.has(key)) {
    return COMPANY_CACHE.get(key);
  }

  let company = await Company.findOne({
    name: {
      $regex: `^${companyName.trim()}$`,
      $options: "i",
    },
  });

  if (!company) {
    company = await Company.create({
      name: companyName.trim(),
      jobCount: 1,
    });
  } else {
    await Company.findByIdAndUpdate(company._id, {
      $inc: {
        jobCount: 1,
      },
    });
  }

  COMPANY_CACHE.set(key, company);

  return company;
}

// ─────────────────────────────────────────────────────────────
// DUPLICATE HELPERS
// ─────────────────────────────────────────────────────────────

async function alreadyImported(sourceId: string) {
  return await Job.exists({
    sourceId,
  });
}

async function generateUniqueSlug(
  title: string,
  company: string,
  sourceId: string
) {
  let slug = slugify(
    `${title}-${company}-${sourceId}`
  );

  let count = 1;

  while (
    await Job.exists({
      slug,
    })
  ) {
    slug = slugify(
      `${title}-${company}-${sourceId}-${count}`
    );

    count++;
  }

  return slug;
}

// ─────────────────────────────────────────────────────────────
// LOAD ALL JOBS
// ─────────────────────────────────────────────────────────────

async function loadJobs(): Promise<RawExternalJob[]> {
  // const [
  //   remotive,
  //   arbeitnow,
  //   greenhouse,
  //   lever,
  //   ashby,
  //   smartRecruiters,
  //   teamtailor,
  // ] = await Promise.all([
  //   fetchFromRemotive().catch(() => []),
  //   fetchFromArbeitnow().catch(() => []),
  //   fetchFromGreenhouse().catch(() => []),
  //   fetchFromLever().catch(() => []),
  //   fetchFromAshby().catch(() => []),
  //   fetchFromSmartRecruiters().catch(() => []),
  //   fetchFromTeamtailor().catch(() => []),
  // ]);

  const [
      remotive,
      arbeitnow,
      atsJobs,

  ] = await Promise.all([

      fetchFromRemotive()
      .catch(() => []),


      fetchFromArbeitnow()
      .catch(() => []),


      fetchCompanyJobs()
      .catch(() => []),

  ]);

  // console.log("\n──────── SOURCES ────────");

  // console.log("Remotive         :", remotive.length);
  // console.log("Arbeitnow        :", arbeitnow.length);
  // console.log("ATS Companies    :", atsJobs.length);

  // console.log("─────────────────────────\n");

  return [
    ...remotive,
    ...arbeitnow,
    ...atsJobs,
];
}

// ─────────────────────────────────────────────────────────────
// MAIN IMPORTER
// ─────────────────────────────────────────────────────────────

export async function runJobImport(): Promise<ImportStats> {
  if (isImportRunning) {
    console.log("⚠️ Import already running. Skipping.");
    
    return {
      imported:0,
      skipped:0,
      rejected:0,
      errors:0
    };
  }


  isImportRunning = true;

  try{

    console.log("\n========================================");
  console.log("🚀 Starting Salesforce Job Import");
  console.log("========================================\n");

  const systemUser = await getSystemUser();

  const allJobs = await loadJobs();

  console.log(`Fetched ${allJobs.length} jobs.\n`);

  let imported = 0;
  let skipped = 0;
  let rejected = 0;
  let errors = 0;

  // ------------------------------------
  // Evaluate jobs using rule engine
  // ------------------------------------

  const acceptedJobs: RawExternalJob[] = [];

  for (const job of allJobs) {
    const result = evaluateSalesforceJob(job);

    if (!result.accepted) {
      rejected++;

      // console.log(
      //   `⛔ ${job.title}\n   ${result.reason}`
      // );

      continue;
    }

    acceptedJobs.push(job);
  }

  console.log(
    `\n✅ ${acceptedJobs.length} jobs passed Salesforce filtering.\n`
  );

  // ------------------------------------
  // Sort newest first
  // ------------------------------------

  acceptedJobs.sort((a, b) => {
    const dateA = a.postedAt
      ? new Date(a.postedAt).getTime()
      : 0;

    const dateB = b.postedAt
      ? new Date(b.postedAt).getTime()
      : 0;

    return dateB - dateA;
  });

  const jobsToImport = acceptedJobs.slice(0, MAX_IMPORTS);

  console.log(
    `Importing ${jobsToImport.length} newest jobs...\n`
  );

  // ------------------------------------
  // Import loop starts here
  // ------------------------------------

  for (const raw of jobsToImport) {
    try {
      // Skip duplicate source IDs

      if (await alreadyImported(raw.sourceId)) {

          skipped++;

          // console.log(
          //   `⚠ Already exists: ${raw.title} | ${raw.sourceId}`
          // );

          continue;
      }

      const company = await getCompany(raw.companyName);

      const slug = await generateUniqueSlug(
        raw.title,
        raw.companyName,
        raw.sourceId
      );

      // AI enrichment happens ONLY after
      // the rule engine has approved the job.

      const fullDescription = await getFullDescription(raw);
      const promptDescription = fullDescription.slice(0, 8000);
      const enriched = await enrichWithAI(raw, promptDescription);

      await Job.create({
        title:                   raw.title,
        slug,
        description:             enriched.cleanDescription || fullDescription,
        overview:                enriched.overview,
        responsibilities:        enriched.responsibilities || [],
        requirements:            enriched.requirements || [],
        preferredQualifications: enriched.preferredQualifications || [],
        benefits:                enriched.benefits || [],
        skills: normalizeSkills(enriched.skills),
        salesforceProducts:      enriched.salesforceProducts || [],
        certifications:          enriched.certifications || [],
        location:                raw.location,
        workMode:                enriched.workMode ?? "Onsite",
        experienceLevel: convertExperienceLevel(
            enriched.experienceLevel
        ),
        roleCategory:            enriched.roleCategory,
        employmentType:          enriched.employmentType,
        applyUrl:                raw.applyUrl,
        source:                  raw.source,
        sourceId:                raw.sourceId,
        postedAt:                raw.postedAt ? new Date(raw.postedAt) : new Date(),
        company:                 company._id,
      });

      //       await Job.create({
      //   title: raw.title,

      //   slug,

      //   description:
      //     enriched.description || raw.description,

      //   location: raw.location,

      //   workMode: enriched.workMode,

      //   experienceLevel: convertExperienceLevel(
      //     enriched.experienceLevel
      //   ),

      //   roleCategory: enriched.roleCategory,

      //   skills: normalizeSkills(enriched.skills),

      //   employmentType: enriched.employmentType,

      //   applyUrl: raw.applyUrl,

      //   source: raw.source,

      //   sourceId: raw.sourceId,

      //   postedAt: raw.postedAt
      //     ? new Date(raw.postedAt)
      //     : new Date(),

      //   company: company._id,

      //   postedBy: systemUser._id,
      // });

      imported++;

      console.log(
        `✅ Imported: ${raw.title} (${raw.companyName})`
      );
    } catch (error: any) {

      // Duplicate slug or source ID
      if (error?.code === 11000) {

        skipped++;

        console.log(
          `⚠ Duplicate skipped: ${raw.title}`
        );

        continue;
      }

      errors++;

      console.error(
        `❌ Failed to import "${raw.title}"`,
        error
      );
    }
  }

  console.log("\n========================================");
  console.log("📊 Import Summary");
  console.log("========================================");

  console.log(`Fetched   : ${allJobs.length}`);
  console.log(`Imported  : ${imported}`);
  console.log(`Skipped   : ${skipped}`);
  console.log(`Rejected  : ${rejected}`);
  console.log(`Errors    : ${errors}`);

  //   console.log("========================================\n");
  COMPANY_CACHE.clear();
  return {
    imported,
    skipped,
    rejected,
    errors,
  };
  }
  finally {

        COMPANY_CACHE.clear();

        isImportRunning = false;

        console.log("Importer unlocked");

    }
}

// ─────────────────────────────────────────────────────────────
// OPTIONAL UTILITIES
// (Useful later for queues / workers / testing)
// ─────────────────────────────────────────────────────────────

export async function previewImport() {
  const jobs = await loadJobs();

  const accepted: RawExternalJob[] = [];
  const rejected: RawExternalJob[] = [];

  for (const job of jobs) {
    const result = evaluateSalesforceJob(job);

    if (result.accepted) {
      accepted.push(job);
    } else {
      rejected.push(job);
    }
  }

  return {
    total: jobs.length,
    accepted: accepted.length,
    rejected: rejected.length,
    acceptedJobs: accepted,
    rejectedJobs: rejected,
  };
}

export async function testSingleJob(job: RawExternalJob) {
  const result = evaluateSalesforceJob(job);

  console.log("\n==============================");
  console.log("Job:", job.title);
  console.log("Company:", job.companyName);
  console.log("Accepted:", result.accepted);
  console.log("Reason:", result.reason);
  console.log("Matched Tech:", result.matchedTechnology);
  console.log("==============================\n");

  return result;
}
