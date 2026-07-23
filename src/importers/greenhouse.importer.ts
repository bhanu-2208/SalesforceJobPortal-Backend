// import { RawExternalJob } from "./types";
// import { mapWithConcurrencyLimit } from "./concurrency";

// const GREENHOUSE_COMPANIES = [
//   "salesforce",
//   "slack",
//   "docusign",
//   "zendesk",
//   "hubspot",
//   "asana",
//   "airtable",
//   "figma",
//   "stripe",
//   "twilio",
//   "datadog",
//   "dropbox",
//   "snowflake",
//   "plaid",
//   "mongodb",
//   "canva",
//   "reddit",
//   "discord",
//   "coinbase",
//   "rippling",
//   "notion",
//   "brex",
//   "ramp",
//   "openai",
//   "anthropic",
//   "vercel",
//   "cloudflare",
//   "cockroachlabs",
//   "elastic",
//   "hashicorp",
//   "gitlab",
//   "circleci",
//   "benchling",
//   "gusto",
//   "zapier",
//   "miro",
//   "samsara",
//   "grammarly",
//   "instacart",
//   "robinhood",
//   "oscarhealth",
//   "checkr",
//   "flexport",
//   "newrelic",
//   "yelp",
// ];

// const MAX_CONCURRENT_REQUESTS = 8;

// async function fetchCompanyJobs(company: string): Promise<RawExternalJob[]> {
//   try {
//     const res = await fetch(
//       `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`
//     );
//     if (!res.ok) return []; // company may not use Greenhouse or board is private

//     const data = await res.json();
//     const jobs = (data.jobs || []).filter((j: any) =>
//       j.title?.toLowerCase().includes("salesforce")
//     );

//     return jobs.map((j: any) => ({
//       sourceId: `greenhouse-${j.id}`,
//       source: "Greenhouse",
//       title: j.title,
//       companyName: company.charAt(0).toUpperCase() + company.slice(1),
//       location: j.location?.name,
//       description: (j.content || "").replace(/<[^>]+>/g, " ").slice(0, 4000),
//       applyUrl: j.absolute_url,
//       postedAt: j.updated_at,
//     }));
//   } catch {
//     // one company's board being down shouldn't stop the others
//     return [];
//   }
// }

// export async function fetchFromGreenhouse(): Promise<RawExternalJob[]> {
//   const perCompanyResults = await mapWithConcurrencyLimit(
//     GREENHOUSE_COMPANIES,
//     MAX_CONCURRENT_REQUESTS,
//     fetchCompanyJobs
//   );

//   return perCompanyResults.flat();
// }

import { cleanJobDescription } from "../utils/cleanJobDescription";
import { RawExternalJob } from "./types";


export async function fetchFromGreenhouse(
    token:string,
    companyName:string
):Promise<RawExternalJob[]>{


    try{


        const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`
        );


        if(!res.ok){
            return [];
        }


        const data:any =
        await res.json();


        return (data.jobs || [])
        .map((j:any)=>({

            sourceId:
            `greenhouse-${j.id}`,


            source:
            "Greenhouse",


            title:
            j.title,


            companyName,


            location:
            j.location?.name,


            description:
            cleanJobDescription(j.content),


            applyUrl:
            j.absolute_url,


            postedAt:
            j.updated_at


        }));


    }
    catch(error){

        console.log(
          "Greenhouse failed:",
          companyName
        );

        return [];

    }

}