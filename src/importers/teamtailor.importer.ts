import { RawExternalJob } from "./types";
import { mapWithConcurrencyLimit } from "./concurrency";

const TEAMTAILOR_COMPANIES = [
  "contentsquare",
  "eletive",
  "estrid",
  "juni",
  "northmill",
  "benify",
  "kry",
  "lifesum",
  "doktorse",
  "trustly",
  "tink",
  "insurello",
  "funnel",
];

const MAX_CONCURRENT_REQUESTS = 8;

async function fetchCompanyJobs(company: string): Promise<RawExternalJob[]> {
  try {
    const res = await fetch(`https://${company}.teamtailor.com/jobs.json`);
    if (!res.ok) return [];

    const jobs = await res.json();

    return (Array.isArray(jobs) ? jobs : [])
      .filter((j: any) => j.title?.toLowerCase().includes("salesforce"))
      .map((j: any) => ({
        sourceId: `teamtailor-${j.id}`,
        source: "Teamtailor",
        title: j.title,
        companyName: company.charAt(0).toUpperCase() + company.slice(1),
        location: j.location,
        description: j.body ?? "",
        applyUrl: j.url,
        postedAt: j.created_at,
      }));
  } catch {
    return [];
  }
}

export async function fetchFromTeamtailor(): Promise<RawExternalJob[]> {
  const perCompanyResults = await mapWithConcurrencyLimit(
    TEAMTAILOR_COMPANIES,
    MAX_CONCURRENT_REQUESTS,
    fetchCompanyJobs
  );

  return perCompanyResults.flat();
}