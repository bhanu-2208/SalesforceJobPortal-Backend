import { cleanJobDescription } from "../utils/cleanJobDescription";
import { RawExternalJob } from "./types";


export async function fetchFromLever(
    token: string,
    companyName: string
): Promise<RawExternalJob[]> {


    const jobs: RawExternalJob[] = [];


    try {


        const res = await fetch(
            `https://api.lever.co/v0/postings/${token}?mode=json`
        );


        if(!res.ok){

            console.log(
                `Lever unavailable: ${companyName}`
            );

            return [];
        }



        const postings:any[] =
            await res.json();



        for(const posting of postings){


            const description = `

${posting.descriptionPlain ?? ""}

${
posting.lists
?.map((x:any)=>x.content)
.join("\n")
?? ""
}

`;



            jobs.push({

                sourceId:
                `lever-${posting.id}`,


                source:
                "Lever",


                title:
                posting.text,


                companyName,


                location:
                posting.categories?.location ??
                "Remote",


                description:
                cleanJobDescription(description),


                applyUrl:
                posting.hostedUrl,


                postedAt:
                posting.createdAt
                ?
                new Date(posting.createdAt)
                .toISOString()
                :
                undefined

            });


        }



    }
    catch(error){

        // console.log(
        //     `Lever failed ${companyName}`,
        //     error
        // );

    }



    return jobs;

}



// import { evaluateSalesforceJob } from "../services/salesforceruleengine.service";

// interface RawExternalJob {
//   sourceId: string;
//   source: string;
//   title: string;
//   companyName: string;
//   location?: string;
//   description: string;
//   applyUrl: string;
//   postedAt?: string;
// }

// const LEVER_COMPANIES = [
//   "discord",
//   "figma",
//   "asana",
//   "reddit",
//   "samsara",
//   "coinbase",
//   "datadog",
//   "canva",
//   "brex",
//   "airtable",
//   "rippling",
//   "stripe",
//   "zapier",
//   "coursera",
//   "monday",
// ];

// export async function fetchFromLever(): Promise<RawExternalJob[]> {
//   const jobs: RawExternalJob[] = [];

//   for (const company of LEVER_COMPANIES) {
//     try {
//       const res = await fetch(
//         `https://api.lever.co/v0/postings/${company}?mode=json`
//       );

//       if (!res.ok) continue;

//       const postings = await res.json();

//       for (const posting of postings) {
//         const description = `
// ${posting.descriptionPlain ?? ""}
// ${posting.lists?.map((x: any) => x.content).join("\n") ?? ""}
// `;

//         const result = evaluateSalesforceJob({
//           title: posting.text,
//           description,
//         });

//         if (!result.accepted) {
//           console.log(
//             `  ⛔ Rejected "${posting.text}" — ${result.reason}`
//           );
//           continue;
//         }

//         console.log(
//           `  ✅ Accepted "${posting.text}" (${result.reason})`
//         );

//         jobs.push({
//           sourceId: `lever-${posting.id}`,
//           source: "Lever",
//           title: posting.text,
//           companyName: company,
//           location:
//             posting.categories?.location ??
//             "Remote",

//           description,

//           applyUrl: posting.hostedUrl,

//           postedAt: posting.createdAt
//             ? new Date(posting.createdAt).toISOString()
//             : undefined,
//         });
//       }
//     } catch (err) {
//       console.error(`Lever error (${company})`, err);
//     }
//   }

//   console.log(`Lever: ${jobs.length} Salesforce jobs`);

//   return jobs;
// }





// // export const LEVER_COMPANIES = [
// //   { company: "Netflix", handle: "netflix" },
// //   { company: "Shopify", handle: "shopify" },
// //   { company: "Brex", handle: "brex" },
// //   { company: "Ramp", handle: "ramp" },
// //   { company: "Vercel", handle: "vercel" },
// //   { company: "Linear", handle: "linear" },

// //   { company: "Mixpanel", handle: "mixpanel" },
// //   { company: "Postman", handle: "postman" },
// //   { company: "Miro", handle: "miro" },
// //   { company: "BrowserStack", handle: "browserstack" },
// //   { company: "Canva", handle: "canva" },
// //   { company: "Sourcegraph", handle: "sourcegraph" },
// //   { company: "Cockroach Labs", handle: "cockroachlabs" },
// //   { company: "Snyk", handle: "snyk" },
// //   { company: "CircleCI", handle: "circleci" },
// //   { company: "LaunchDarkly", handle: "launchdarkly" },
// //   { company: "Contentful", handle: "contentful" },
// //   { company: "Gong", handle: "gong" },
// //   { company: "NerdWallet", handle: "nerdwallet" },
// //   { company: "Intercom", handle: "intercom" },
// //   { company: "Yelp", handle: "yelp" },
// //   { company: "Headspace", handle: "headspace" },
// //   { company: "Nextdoor", handle: "nextdoor" },
// //   { company: "MongoDB", handle: "mongodb" },
// //   { company: "Robinhood", handle: "robinhood" },
// //   { company: "CloudBees", handle: "cloudbees" },
// //   { company: "Lattice", handle: "lattice" },
// //   { company: "Drata", handle: "drata" },
// //   { company: "Fivetran", handle: "fivetran" },
// //   { company: "Heap", handle: "heap" },
// //   { company: "Pleo", handle: "pleo" },
// //   { company: "Aircall", handle: "aircall" },
// //   { company: "Zapier", handle: "zapier" },
// //   { company: "HashiCorp", handle: "hashicorp" },
// //   { company: "Pinecone", handle: "pinecone" },
// //   { company: "ClickHouse", handle: "clickhouse" },
// //   { company: "dbt Labs", handle: "dbtlabs" },
// // ];

// // interface RawExternalJob {
// //   sourceId: string; source: string; title: string; companyName: string;
// //   location?: string; description: string; applyUrl: string; postedAt?: string;
// // }

// // export async function fetchFromLever(): Promise<RawExternalJob[]> {
// //   const results: RawExternalJob[] = [];

// //   for (const company of LEVER_COMPANIES) {
// //     try {
// //       const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
// //       if (!res.ok) continue;

// //       const data = await res.json();
// //       const jobs = (data || []).filter((j: any) =>
// //         j.text?.toLowerCase().includes("salesforce")
// //       );

// //       for (const j of jobs) {
// //         results.push({
// //           sourceId:    `lever-${j.id}`,
// //           source:      "Lever",
// //           title:       j.text,
// //           companyName: company.company,
// //           location:    j.categories?.location,
// //           description: (j.descriptionPlain || j.description || "").slice(0, 4000),
// //           applyUrl:    j.hostedUrl,
// //           postedAt:    j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
// //         });
// //       }
// //     } catch {
// //       continue;
// //     }
// //   }

// //   return results;
// // }