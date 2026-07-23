import { GoogleGenerativeAI } from "@google/generative-ai";
import { jdRequirementsSchema, JdRequirements } from "../models/jdRequirements";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const JD_PROMPT = `
  You are an expert Salesforce technical recruiter, ATS (Applicant Tracking System) parser,
  and hiring analyst.

  Your task is to analyze the provided job description and extract structured hiring
  requirements.

  The job description may contain:
  - HTML formatting
  - repeated company information
  - marketing text
  - unrelated benefits sections
  - incomplete sentences

  Ignore irrelevant information and extract ONLY hiring-related information.

  Your output MUST be ONLY valid JSON.
  Do not include markdown.
  Do not include explanations.
  Do not include code fences.

  ================================================

  RETURN JSON IN THIS EXACT FORMAT:

  {
    "roleTitle": "",

    "normalizedRoleTitle": "",

    "department": "",


    "requiredSkills": [],

    "niceToHaveSkills": [],


    "salesforceSkills": {
      "development": [],
      "administration": [],
      "automation": [],
      "integration": [],
      "data": [],
      "cloudProducts": []
    },


    "programmingSkills": [],

    "cloudSkills": [],

    "databaseSkills": [],


    "preferredCertifications": [],


    "experience": {
      "minYears": 0,
      "maxYears": null,
      "level":
        "Intern" |
        "Fresher" |
        "Associate" |
        "Mid" |
        "Senior" |
        "Lead" |
        null
    },


    "educationRequirements": [],


    "employmentType":
        "Full-time" |
        "Part-time" |
        "Contract" |
        "Internship" |
        null,


    "workMode":
        "Remote" |
        "Hybrid" |
        "Onsite" |
        null,


    "location": "",


    "responsibilities": [],


    "technicalRequirements": [],


    "softSkills": [],


    "responsibilityKeywords": [],


    "certificationKeywords": [],


    "industryKeywords": [],


    "salaryInformation": {
        "min": null,
        "max": null,
        "currency": null
    },


    "candidateProfileSummary": ""
  }


  ================================================

  EXTRACTION RULES


  ROLE TITLE:

  Extract the official job title.

  Normalize unclear titles.

  Examples:

  "CRM Engineer"
  should become:

  "Salesforce Engineer"


  "Business Systems Analyst - Salesforce"
  should become:

  "Salesforce Business Systems Analyst"


  "Application Developer"
  should become Salesforce Developer only if Salesforce is clearly mentioned.



  ================================================


  SALESFORCE SKILL EXTRACTION:

  Extract ALL Salesforce-related technologies.

  Categorize correctly.


  Salesforce Development:

  Examples:

  Apex
  Apex Classes
  Apex Triggers
  Batch Apex
  Queueable Apex
  Future Methods
  Lightning Web Components
  LWC
  Aura Components
  Visualforce
  SOQL
  SOSL
  Salesforce APIs
  REST API
  SOAP API
  Platform Events
  Change Data Capture
  Salesforce DX
  Metadata API
  Tooling API


  Salesforce Administration:

  Examples:

  Salesforce Administration
  Profiles
  Roles
  Permission Sets
  Sharing Rules
  Validation Rules
  Reports
  Dashboards
  Security Model
  User Management
  Data Loader


  Salesforce Automation:

  Examples:

  Flow Builder
  Flows
  Process Builder
  Workflow Rules
  Approval Processes
  OmniStudio
  Apex Automation


  Salesforce Integration:

  Examples:

  MuleSoft
  REST Integration
  SOAP Integration
  Middleware
  External Systems Integration
  OAuth
  Named Credentials


  Salesforce Data:

  Examples:

  Data Migration
  Data Loader
  Data Import Wizard
  Data Quality
  Salesforce Objects
  Schema Design


  Salesforce Clouds:

  Examples:

  Sales Cloud
  Service Cloud
  Experience Cloud
  Marketing Cloud
  Commerce Cloud
  Financial Services Cloud
  Health Cloud
  CPQ
  Revenue Cloud


  DO NOT ADD SALESFORCE SKILLS THAT ARE NOT PRESENT.

  ================================================


  PROGRAMMING SKILLS:

  Extract programming languages only.

  Examples:

  Java
  JavaScript
  TypeScript
  Python
  C#
  SQL
  HTML
  CSS


  Do not classify tools as programming languages.


  ================================================


  CLOUD SKILLS:

  Extract:

  AWS
  Azure
  Google Cloud
  Lambda
  EC2
  Docker
  Kubernetes
  Terraform


  ================================================


  DATABASE SKILLS:

  Extract:

  SQL
  PostgreSQL
  MySQL
  MongoDB
  Oracle
  Redis
  Snowflake


  ================================================


  CERTIFICATIONS:

  Only extract named certifications.

  Examples:

  Salesforce Certified Administrator

  Salesforce Platform Developer I

  Salesforce Platform Developer II

  Salesforce Certified Advanced Administrator


  Do NOT return:

  "certification preferred"

  unless a certification name exists.


  ================================================


  EXPERIENCE:

  Convert years into levels:


  0-1 years:

  Intern/Fresher


  1-3 years:

  Associate


  3-6 years:

  Mid


  6-8 years:

  Senior


  8+ years:

  Lead


  If experience is not mentioned:

  minYears = 0

  level = null


  ================================================


  RESPONSIBILITIES:

  Convert responsibilities into short searchable phrases.

  Example:


  Bad:

  "Candidate will work closely with multiple teams to develop innovative solutions"


  Good:

  [
  "Develop Salesforce applications",
  "Create Apex triggers",
  "Build Lightning components",
  "Integrate Salesforce with external systems"
  ]


  Return maximum 15 responsibilities.


  ================================================


  RESPONSIBILITY KEYWORDS:

  Create keywords useful for resume matching.

  Examples:

  [
  "Salesforce development",
  "Apex programming",
  "LWC development",
  "Salesforce integration",
  "CRM customization"
  ]


  ================================================


  TECHNICAL REQUIREMENTS:

  Extract mandatory technical requirements.

  Examples:

  [
  "Apex development experience",
  "LWC experience",
  "Salesforce administration knowledge"
  ]


  ================================================


  SOFT SKILLS:

  Extract only genuine soft skills.

  Examples:

  Leadership
  Communication
  Problem solving
  Stakeholder management


  Do not add generic words like:

  "hardworking"
  "passionate"


  ================================================


  CANDIDATE PROFILE SUMMARY:

  Write a recruiter-friendly summary:

  Requirements:

  - 3-5 sentences
  - Describe ideal candidate
  - Mention Salesforce expertise
  - Mention experience level
  - Mention major technologies

  Do NOT copy sentences from JD.


  ================================================


  IMPORTANT:

  If information does not exist:

  Arrays:
  []

  Numbers:
  0

  Unknown strings:
  null


  Never hallucinate skills.

  Only extract skills explicitly mentioned
  or strongly implied by the job requirements.



  JOB DESCRIPTION:

  """
  {{JD_TEXT}}
  """

  `;

function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
}

export async function extractJdRequirements(jdText: string): Promise<JdRequirements> {
  if (!jdText || jdText.trim().length < 30) {
    throw new Error("That job description looks too short to analyze — please paste the full JD.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = JD_PROMPT.replace("{{JD_TEXT}}", jdText.slice(0, 15000));

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