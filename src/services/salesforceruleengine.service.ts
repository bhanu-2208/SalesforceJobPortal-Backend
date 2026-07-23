// services/salesforceRuleEngine.ts
//
// Rule-based Salesforce job filter — replaces the old point-based scorer.
// Flow:
//   1. Title contains a hard-reject department term?           → REJECT (absolute)
//   2. Title explicitly identifies as a Salesforce role?        → ACCEPT
//   3. Otherwise, description must show ≥5 Salesforce           → ACCEPT / REJECT
//      technology signals as mandatory evidence
//
// This treats ambiguity as guilty-until-proven-innocent, which is the
// correct posture for a single-platform job board.

interface ScorableJob {
  title: string;
  description: string;
}

// ── Word-boundary matcher — avoids "Sales" matching inside "Salesforce" ──
function containsWord(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  return pattern.test(text);
}

function countMatches(text: string, terms: string[]): number {
  return terms.filter(term => containsWord(text, term)).length;
}

// ══════════════════════════════════════════════════════════════════
// STEP 1 — Hard reject list. Any of these in the TITLE = instant reject,
// no exceptions. These are job families this portal never wants,
// regardless of how much "Salesforce" appears in the description.
// ══════════════════════════════════════════════════════════════════
const REJECT_TITLE_TERMS: string[] = [
  "Recruiter", "Talent Acquisition", "HR", "Human Resources",
  "Designer", "UX Designer", "UI Designer", "Graphic Designer",
  "Finance", "Accountant", "Accounting", "Payroll",
  "Legal", "Attorney", "Lawyer", "Paralegal",
  "Marketing Manager", "Content Writer", "Copywriter", "Social Media",
  "Sales", "Account Executive", "Sales Representative", "Sales Rep",
  "SDR", "BDR", "Business Development Representative", "Business Development Rep",
  "Customer Success", "Customer Support", "Support Specialist",
  "Program Manager", "Product Manager", "Project Coordinator",
  "Data Engineer", "Data Scientist", "Machine Learning Engineer", "ML Engineer",
  "Backend Engineer", "Frontend Engineer", "Full Stack Engineer", "Full-Stack Engineer",
  "Security Engineer", "Network Engineer", "Site Reliability", "SRE",
  "Platform Engineer", "DevOps", "Infrastructure Engineer",
  "QA Engineer", "Quality Assurance", "Test Engineer",
  "Executive Assistant", "Office Manager", "Receptionist",
];

// ══════════════════════════════════════════════════════════════════
// STEP 2 — Title identity terms. If ANY of these appear in the title,
// this IS a Salesforce role by definition — accept immediately,
// even if the description is thin.
// ══════════════════════════════════════════════════════════════════
const SALESFORCE_TITLE_TERMS: string[] = [
  "Salesforce", "SFDC",
  "CRM Developer", "CRM Engineer", "CRM Consultant",
  "CRM Architect", "CRM Administrator", "CRM Analyst",
];

// ══════════════════════════════════════════════════════════════════
// STEP 3 — Mandatory technology evidence. Used ONLY when the title
// itself doesn't already prove it's a Salesforce role. Covers every
// major cloud/product area so Developer, Admin, Architect, CPQ,
// Marketing Cloud, Data Cloud, Agentforce, MuleSoft, and Commerce
// Cloud roles are all still detectable via description content.
// ══════════════════════════════════════════════════════════════════
const SALESFORCE_TECH_TERMS: string[] = [
  // Core platform / development
  "Apex", "LWC", "Lightning Web Component", "Lightning Web Components",
  "Visualforce", "SOQL", "SOSL", "Aura Component", "Aura Components",
  "Salesforce DX", "SFDX", "Omni-Studio", "OmniStudio", "Vlocity",
  "Trailhead", "Salesforce Flow", "Process Builder", "Workflow Rules",
  "Apex Trigger", "Apex Triggers", "Apex Class", "Batch Apex",
  // Clouds / products
  "Sales Cloud", "Service Cloud", "Marketing Cloud", "Experience Cloud",
  "Community Cloud", "Commerce Cloud", "Data Cloud", "Analytics Cloud",
  "CRM Analytics", "Tableau CRM", "Health Cloud", "Financial Services Cloud",
  "Nonprofit Cloud", "Education Cloud", "Field Service Lightning", "Field Service",
  "Agentforce", "Einstein", "Einstein GPT", "Einstein Bots",
  // Integration / config tools
  "CPQ", "Steelbrick", "Pardot", "MuleSoft", "Salesforce Connect",
  "Salesforce Integration", "REST API Salesforce", "SOAP API Salesforce",
  "Platform Events", "Change Data Capture", "Salesforce Shield",
  // Certifications (strong evidence of genuine platform role)
  "Salesforce Certified", "Salesforce Certification", "ADM 201", "ADM201",
  "Platform Developer I", "Platform Developer II", "Application Architect",
  "System Architect", "Technical Architect", "CTA",
];

const MANDATORY_TECH_THRESHOLD = 5; // minimum distinct tech terms required for ambiguous titles

// ══════════════════════════════════════════════════════════════════
// Public API
// ══════════════════════════════════════════════════════════════════
export interface RuleResult {
  accepted: boolean;
  reason:   string;
  matchedTech: string[];
}

export function evaluateSalesforceJob(job: ScorableJob): RuleResult {
  const title = job.title || "";
  const description = job.description || "";
  const fullText = `${title} ${description}`;

  // ── STEP 1 — hard reject list (absolute, checked first) ──
  const rejectHit = REJECT_TITLE_TERMS.find(term => containsWord(title, term));
  if (rejectHit) {
    return { accepted: false, reason: `Title contains excluded department term: "${rejectHit}"`, matchedTech: [] };
  }

  // ── STEP 2 — title explicitly identifies as Salesforce role ──
  const titleHit = SALESFORCE_TITLE_TERMS.find(term => containsWord(title, term));
  if (titleHit) {
    const matched = SALESFORCE_TECH_TERMS.filter(term => containsWord(fullText, term));
    return { accepted: true, reason: `Title explicitly identifies as Salesforce role ("${titleHit}")`, matchedTech: matched };
  }

  // ── STEP 3 — ambiguous title, require mandatory tech evidence ──
  const matchedTech = SALESFORCE_TECH_TERMS.filter(term => containsWord(fullText, term));
  if (matchedTech.length >= MANDATORY_TECH_THRESHOLD) {
    return {
      accepted: true,
      reason: `Ambiguous title, but ${matchedTech.length} Salesforce technologies found in description (≥${MANDATORY_TECH_THRESHOLD} required)`,
      matchedTech,
    };
  }

  return {
    accepted: false,
    reason: `Ambiguous title with insufficient evidence — only ${matchedTech.length} Salesforce technologies found (need ≥${MANDATORY_TECH_THRESHOLD})`,
    matchedTech,
  };
}

export function isGenuineSalesforceJob(job: ScorableJob): boolean {
  return evaluateSalesforceJob(job).accepted;
}