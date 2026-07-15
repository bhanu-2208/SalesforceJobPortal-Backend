interface ScorableJob {
  title: string;
  description: string;
}

// Strong signals — real Salesforce platform work
const STRONG_SIGNALS = [
  "apex", "lwc", "lightning web component", "soql", "sosl",
  "visualforce", "trailhead", "salesforce certified", "salesforce certification",
  "salesforce administrator", "salesforce developer", "salesforce architect",
  "salesforce consultant", "salesforce admin", "sales cloud", "service cloud",
  "marketing cloud", "experience cloud", "cpq", "pardot", "mulesoft",
  "salesforce platform", "salesforce dx", "salesforce flow", "process builder",
  "salesforce integration", "salesforce implementation", "field service lightning",
];

// Weak signals — could appear in unrelated sales jobs, worth less
const WEAK_SIGNALS = [
  "salesforce", "crm", "salesforce.com",
];

// Red flags — these strongly suggest it's a generic sales/account role, NOT platform work
const NEGATIVE_SIGNALS = [
  "quota", "commission", "cold calling", "cold-calling", "b2b sales",
  "account executive", "sales representative", "sales rep", "sdr",
  "business development representative", "outbound sales", "closing deals",
  "revenue target", "sales quota", "territory management",
];

export function scoreSalesforceRelevance(job: ScorableJob): number {
  const text = `${job.title} ${job.description}`.toLowerCase();
  let score = 0;

  for (const signal of STRONG_SIGNALS) {
    if (text.includes(signal)) score += 10;
  }
  for (const signal of WEAK_SIGNALS) {
    if (text.includes(signal)) score += 2;
  }
  for (const signal of NEGATIVE_SIGNALS) {
    if (text.includes(signal)) score -= 15;
  }

  // Title match is the strongest signal of all — weight it heavily
  const titleLower = job.title.toLowerCase();
  if (/salesforce\s+(developer|administrator|admin|architect|consultant|engineer)/.test(titleLower)) {
    score += 25;
  }

  return score;
}

// A job must score at least this high to be imported.
// Tune this up if you're still seeing bad matches, down if you want more volume.
export const MIN_SALESFORCE_SCORE = 10;

export function isGenuineSalesforceJob(job: ScorableJob): boolean {
  return scoreSalesforceRelevance(job) >= MIN_SALESFORCE_SCORE;
}