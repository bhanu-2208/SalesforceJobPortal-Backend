// import { RawExternalJob } from "./types";
// import { mapWithConcurrencyLimit } from "./concurrency";

// // NOTE: these are Ashby "job board names" (the slug in
// // https://jobs.ashbyhq.com/<slug>), not always the same as the company's
// // display name.
// const ASHBY_COMPANIES = [
//   "openai",
//   "anthropic",
//   "retool",
//   "vanta",
//   "mercury",
//   "runway",
//   "modal",
//   "hex",
//   "clickhouse",
//   "pylon",
//   "dagster",
//   "warp",
//   "pinecone",
//   "planetscale",
//   "render",
//   "clerk",
//   "orb",
//   "lattice",
//   "coder",
//   "sourcegraph",
//   "linear",
//   "loom",
//   "framer",
//   "webflow",
//   "replit",
//   "scale",
//   "perplexity-ai",
//   "watershed",
//   "mux",
//   "netlify",
//   "substack",
//   "deel",
//   "remote",
//   "affirm",
//   "attentive",
//   "gem",
//   "temporal",
//   "vercel",
//   "cohere",
//   "airbyte",
//   "posthog",
//   "supabase",
//   "n8n",
//   "assemblyai",
// ];

// const MAX_CONCURRENT_REQUESTS = 8;

// interface AshbyApiJob {
//   id: string;
//   title: string;
//   location?: string;
//   descriptionPlain?: string;
//   descriptionHtml?: string;
//   publishedAt?: string;
//   jobUrl?: string;
//   applyUrl?: string;
//   isListed?: boolean;
// }

// interface AshbyApiResponse {
//   organizationName?: string;
//   jobs?: AshbyApiJob[];
// }

// function capitalize(slug: string): string {
//   return slug
//     .split(/[-_]/)
//     .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
//     .join(" ");
// }

// async function fetchCompanyJobs(company: string): Promise<RawExternalJob[]> {
//   try {
//     // Ashby's public, unauthenticated job-board API. This is the same data
//     // source Ashby's own embeddable widgets use, and it's a lot more
//     // reliable than scraping the rendered HTML page (Ashby has changed how
//     // / whether it inlines __NEXT_DATA__ more than once, which is why the
//     // old scraping approach silently died for most companies).
//     const res = await fetch(
//       `https://api.ashbyhq.com/posting-api/job-board/${company}?includeCompensation=false`
//     );

//     if (!res.ok) return [];

//     const data = (await res.json()) as AshbyApiResponse;
//     const jobs = data?.jobs ?? [];

//     const companyDisplayName = data.organizationName ?? capitalize(company);

//     return jobs
//       .filter((j) => j.isListed !== false)
//       .filter((j) => j.title?.toLowerCase().includes("salesforce"))
//       .map((j) => ({
//         sourceId: `ashby-${company}-${j.id}`,
//         source: "Ashby",
//         title: j.title,
//         companyName: companyDisplayName,
//         location: j.location ?? "",
//         description: j.descriptionPlain ?? j.descriptionHtml ?? "",
//         applyUrl: j.jobUrl ?? j.applyUrl ?? `https://jobs.ashbyhq.com/${company}`,
//         postedAt: j.publishedAt,
//       }));
//   } catch {
//     // One company's board being down/misconfigured shouldn't stop the rest.
//     return [];
//   }
// }

// export async function fetchFromAshby(): Promise<RawExternalJob[]> {
//   const perCompanyResults = await mapWithConcurrencyLimit(
//     ASHBY_COMPANIES,
//     MAX_CONCURRENT_REQUESTS,
//     fetchCompanyJobs
//   );

//   return perCompanyResults.flat();
// }

import { cleanJobDescription } from "../utils/cleanJobDescription";
import { RawExternalJob } from "./types";


interface AshbyApiJob {

    id:string;

    title:string;

    location?:string;

    descriptionPlain?:string;

    descriptionHtml?:string;

    publishedAt?:string;

    jobUrl?:string;

    applyUrl?:string;

    isListed?:boolean;
}



interface AshbyApiResponse {

    organizationName?:string;

    jobs?:AshbyApiJob[];

}



export async function fetchFromAshby(
    token:string,
    companyName:string
):Promise<RawExternalJob[]> {


    try {


        const res = await fetch(
            `https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=false`
        );


        if(!res.ok){

            console.log(
                `Ashby unavailable: ${companyName}`
            );

            return [];

        }



        const data =
        await res.json() as AshbyApiResponse;



        const jobs =
        data.jobs ?? [];



        return jobs

        .filter(
            job =>
            job.isListed !== false
        )


        .map(job=>({


            sourceId:
            `ashby-${token}-${job.id}`,



            source:
            "Ashby",



            title:
            job.title,



            companyName:
            data.organizationName ??
            companyName,



            location:
            job.location ?? "",



            description:
                cleanJobDescription(
                job.descriptionPlain
                ),



            applyUrl:
            job.jobUrl ??
            job.applyUrl ??
            `https://jobs.ashbyhq.com/${token}`,



            postedAt:
            job.publishedAt

        }));



    }
    catch(error){


        console.log(
            `Ashby failed: ${companyName}`,
            error
        );


        return [];

    }


}