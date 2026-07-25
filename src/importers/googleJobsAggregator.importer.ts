import { RawExternalJob } from "./types"; // adjust path to match your project

/**
 * Companies on Greenhouse/Ashby/Lever/SmartRecruiters/Teamtailor can't be
 * enumerated directly — none of those platforms expose a "list every
 * company" endpoint. Instead, we search Google Jobs (via SerpApi) for
 * "salesforce" and keep only results whose apply link points at one of
 * these ATS domains. This gets us "every company" coverage without
 * maintaining a slug list, at the cost of a paid API + its rate limits.
 */

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";

// How many pages of ~10 results each to pull per run. Each page is one
// billed SerpApi request, so this directly controls cost per import cycle.
const MAX_PAGES = Number(process.env.SERPAPI_MAX_PAGES ?? 5);

// Domain -> friendly source name. Extend this list as you find more ATS
// platforms worth tracking (Workday, iCIMS, Jobvite, etc. all follow the
// same "apply_options link" pattern).
const ATS_DOMAIN_SOURCES: { pattern: RegExp; source: string }[] = [
  { pattern: /(^|\.)boards\.greenhouse\.io$/, source: "Greenhouse" },
  { pattern: /(^|\.)job-boards\.greenhouse\.io$/, source: "Greenhouse" },
  { pattern: /(^|\.)jobs\.ashbyhq\.com$/, source: "Ashby" },
  { pattern: /(^|\.)jobs\.lever\.co$/, source: "Lever" },
  { pattern: /(^|\.)jobs\.smartrecruiters\.com$/, source: "SmartRecruiters" },
  { pattern: /\.teamtailor\.com$/, source: "Teamtailor" },
];

interface SerpApiApplyOption {
  title?: string;
  link?: string;
}

interface SerpApiJobResult {
  job_id?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  detected_extensions?: { posted_at?: string };
  apply_options?: SerpApiApplyOption[];
}

interface SerpApiResponse {
  jobs_results?: SerpApiJobResult[];
  serpapi_pagination?: { next_page_token?: string };
  error?: string;
}

function matchAtsSource(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    for (const { pattern, source } of ATS_DOMAIN_SOURCES) {
      if (pattern.test(hostname)) return source;
    }
    return null;
  } catch {
    return null;
  }
}

/** Pull a stable-ish job id out of the apply URL for dedup purposes. */
function deriveSourceId(source: string, applyUrl: string, fallbackId?: string): string {
  try {
    const path = new URL(applyUrl).pathname.replace(/\/+$/, "");
    const lastSegment = path.split("/").filter(Boolean).pop();
    if (lastSegment) return `${source.toLowerCase()}-${lastSegment}`;
  } catch {
    // fall through
  }
  return `${source.toLowerCase()}-${fallbackId ?? Buffer.from(applyUrl).toString("base64").slice(0, 24)}`;
}

async function fetchPage(query: string, nextPageToken?: string): Promise<SerpApiResponse> {
  const params = new URLSearchParams({
    engine: "google_jobs",
    q: query,
    api_key: SERPAPI_KEY ?? "",
  });
  if (nextPageToken) params.set("next_page_token", nextPageToken);

  const res = await fetch(`${SERPAPI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`SerpApi request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SerpApiResponse;
}

export async function fetchFromGoogleJobsAggregator(): Promise<RawExternalJob[]> {
  if (!SERPAPI_KEY) {
    // console.warn("⚠️  SERPAPI_KEY not set — skipping Google Jobs aggregator source.");
    return [];
  }

  const results: RawExternalJob[] = [];
  let nextPageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    let data: SerpApiResponse;
    try {
      data = await fetchPage("salesforce", nextPageToken);
    } catch (err) {
      // console.error("Google Jobs aggregator page failed:", err);
      break;
    }

    if (data.error) {
      // console.error("SerpApi returned an error:", data.error);
      break;
    }

    const jobs = data.jobs_results ?? [];
    if (jobs.length === 0) break;

    for (const job of jobs) {
      const applyOptions = job.apply_options ?? [];

      // Keep only apply links that point at a known ATS — this is what
      // turns "every Google Jobs result" into "every company on these
      // specific ATS platforms."
      for (const option of applyOptions) {
        if (!option.link) continue;
        const source = matchAtsSource(option.link);
        if (!source) continue;

        results.push({
          sourceId: deriveSourceId(source, option.link, job.job_id),
          source,
          title: job.title ?? "",
          companyName: job.company_name ?? "Unknown",
          location: job.location,
          description: job.description ?? "",
          applyUrl: option.link,
          postedAt: undefined, // Google Jobs gives relative text ("3 days ago"), not a date
        });

        // A job can list multiple apply options (e.g. mirrored on two
        // boards); one ATS match per job is enough for our purposes.
        break;
      }
    }

    nextPageToken = data.serpapi_pagination?.next_page_token;
    if (!nextPageToken) break;
  }

  // De-dupe within this run in case the same posting surfaced on more than
  // one page (Google Jobs pagination can occasionally overlap).
  const seen = new Set<string>();
  return results.filter((job) => {
    if (seen.has(job.sourceId)) return false;
    seen.add(job.sourceId);
    return true;
  });
}