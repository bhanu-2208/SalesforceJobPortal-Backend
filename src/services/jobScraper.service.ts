
import Job from "../models/Job";
import Company from "../models/Company";
import User from "../models/User";
import geminiModel from "./gemini.service";

import { ExperienceLevel } from "../models/Job";

import { evaluateSalesforceJob } from "./salesforceFilter";

import { fetchCompanyJobs } from "./atsJob.service";


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
    | "Intern"
    | "Fresher"
    | "Associate"
    | "Mid"
    | "Senior"
    | "Lead"
    | null;

  roleCategory: string | null;

  skills: string[];

  employmentType:
    | "Full-time"
    | "Part-time"
    | "Contract"
    | "Internship"
    | null;

  description: string;
}

interface ImportStats {
  imported: number;
  skipped: number;
  rejected: number;
  errors: number;
}

const MAX_IMPORTS = 200;

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
        job.description
          // ?.replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
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
          job.description
            // ?.replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),

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

async function enrichWithAI(
    raw: RawExternalJob
): Promise<AIEnrichment>{


const prompt = `

You are a senior technical recruiter working for a Salesforce hiring platform.

Your job is to analyze a raw job description from ATS systems
(Greenhouse, Lever, Ashby, SmartRecruiters, Teamtailor).

The description may contain:
- HTML artifacts
- duplicated text
- incomplete sentences
- marketing content
- unrelated company information

Extract ONLY information relevant to the job.

Return ONLY valid JSON.
No markdown.
No explanation.

================================================

JOB INFORMATION

Title:
${raw.title}


Company:
${raw.companyName}


Location:
${raw.location ?? "Unknown"}


Description:

${raw.description.slice(0, 6000)}


================================================


Return this EXACT JSON:


{
"title":"",
"normalizedTitle":"",

"roleCategory":"",

"seniority":
"Intern" |
"Fresher" |
"Associate" |
"Mid" |
"Senior" |
"Lead" |
null,


"experienceYears":
{
"min":number|null,
"max":number|null
},


"workMode":
"Remote" |
"Hybrid" |
"Onsite" |
null,


"employmentType":
"Full-time" |
"Part-time" |
"Contract" |
"Internship" |
null,


"skills":{

"salesforce":[
],

"programming":[
],

"cloud":[
],

"database":[
],

"frontend":[
],

"backend":[
],

"devops":[
],

"tools":[
],

"other":[

]

},


"salesforceExpertise":{

"products":[
],

"development":[
],

"administration":[
],

"certifications":[
]

},


"responsibilities":[
],


"requirements":[
],


"niceToHave":[
],


"benefits":[
],


"description":""

}


================================================


EXTRACTION RULES:


TITLE:

Convert titles into standard hiring titles.

Examples:

"Business Systems Engineer II"
=
"Salesforce Business Systems Engineer"


"CRM Developer"
=
"Salesforce Developer"



------------------------------------------------


SALESFORCE SKILLS:

Extract ALL Salesforce technologies.


Include:

Development:

Apex
Lightning Web Components
Aura
Visualforce
SOQL
SOSL
Triggers
Batch Apex
Queueable Apex
REST API
SOAP API


Automation:

Flow Builder
Process Builder
Workflow Rules
Approval Processes


Administration:

Salesforce Administration
Profiles
Permission Sets
Roles
Sharing Rules
Reports
Dashboards


Cloud:

Sales Cloud
Service Cloud
Experience Cloud
Marketing Cloud
Commerce Cloud
CPQ
Field Service


Data:

Data Loader
Data Import Wizard
Data Migration
ETL


Testing:

Apex Testing
Test Classes
Code Coverage



------------------------------------------------


PROGRAMMING SKILLS:

Extract:

Java
JavaScript
TypeScript
Python
C#
SQL
HTML
CSS


------------------------------------------------


CLOUD:

Extract:

AWS
Azure
GCP
Lambda
EC2
Docker
Kubernetes


------------------------------------------------


DATABASE:

Extract:

MongoDB
PostgreSQL
MySQL
Oracle
Redis


------------------------------------------------


DO NOT INVENT SKILLS.

Only return skills explicitly mentioned
or clearly required.



------------------------------------------------


RESPONSIBILITIES:

Convert paragraphs into clean bullet points.

Example:

Bad:

"Responsible for maintaining applications"


Good:

[
"Develop and maintain Salesforce applications",
"Create Apex triggers and integrations"
]



------------------------------------------------


DESCRIPTION:

Write a professional recruiter-friendly summary.

Requirements:

- 2-3 paragraphs
- No copied sentences
- Mention role purpose
- Mention major technologies
- Mention experience expectations



------------------------------------------------


If information is missing:

Return:

[]
for arrays

null
for unknown values


`;



try{


const result =
await geminiModel.generateContent(prompt);



const cleaned =
result.response.text()
.replace(/^```json/i,"")
.replace(/```$/i,"")
.trim();



return JSON.parse(cleaned);



}
catch (error: any) {
    console.error(
        `AI parsing failed for ${raw.title}: ${error?.message || error}`
    );

    return {
        workMode: null,
        experienceLevel: null,
        roleCategory: "Salesforce",
        skills: ["Salesforce"],
        employmentType: "Full-time",
        description: raw.description,
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

  console.log("\n──────── SOURCES ────────");

  console.log("Remotive         :", remotive.length);
  console.log("Arbeitnow        :", arbeitnow.length);
  console.log("ATS Companies    :", atsJobs.length);

  console.log("─────────────────────────\n");

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

      console.log(
        `⛔ ${job.title}\n   ${result.reason}`
      );

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

      const enriched = await enrichWithAI(raw);

            await Job.create({
        title: raw.title,

        slug,

        description:
          enriched.description || raw.description,

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

        sourceId: raw.sourceId,

        postedAt: raw.postedAt
          ? new Date(raw.postedAt)
          : new Date(),

        company: company._id,

        postedBy: systemUser._id,
      });

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
