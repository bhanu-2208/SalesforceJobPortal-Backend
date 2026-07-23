// import { RawExternalJob } from "./types";
// import { mapWithConcurrencyLimit } from "./concurrency";

// const TEAMTAILOR_COMPANIES = [
//   "contentsquare",
//   "eletive",
//   "estrid",
//   "juni",
//   "northmill",
//   "benify",
//   "kry",
//   "lifesum",
//   "doktorse",
//   "trustly",
//   "tink",
//   "insurello",
//   "funnel",
// ];

// const MAX_CONCURRENT_REQUESTS = 8;

// async function fetchCompanyJobs(company: string): Promise<RawExternalJob[]> {
//   try {
//     const res = await fetch(`https://${company}.teamtailor.com/jobs.json`);
//     if (!res.ok) return [];

//     const jobs = await res.json();

//     return (Array.isArray(jobs) ? jobs : [])
//       .filter((j: any) => j.title?.toLowerCase().includes("salesforce"))
//       .map((j: any) => ({
//         sourceId: `teamtailor-${j.id}`,
//         source: "Teamtailor",
//         title: j.title,
//         companyName: company.charAt(0).toUpperCase() + company.slice(1),
//         location: j.location,
//         description: j.body ?? "",
//         applyUrl: j.url,
//         postedAt: j.created_at,
//       }));
//   } catch {
//     return [];
//   }
// }

// export async function fetchFromTeamtailor(): Promise<RawExternalJob[]> {
//   const perCompanyResults = await mapWithConcurrencyLimit(
//     TEAMTAILOR_COMPANIES,
//     MAX_CONCURRENT_REQUESTS,
//     fetchCompanyJobs
//   );

//   return perCompanyResults.flat();
// }


import { RawExternalJob } from "./types";


export async function fetchFromTeamtailor(
    token: string,
    companyName: string
): Promise<RawExternalJob[]> {


    try {


        const res = await fetch(
            `https://${token}.teamtailor.com/jobs.json`
        );


        if(!res.ok){

            console.log(
                `Teamtailor unavailable: ${companyName}`
            );

            return [];

        }



        const jobs:any[] = await res.json();



        if(!Array.isArray(jobs)){

            return [];

        }



        return jobs

        .filter((job:any)=>{

            const text =
            `${job.title} ${job.body ?? ""}`
            .toLowerCase();


            return text.includes("salesforce");

        })


        .map((job:any)=>({


            sourceId:
            `teamtailor-${token}-${job.id}`,


            source:
            "Teamtailor",


            title:
            job.title,


            companyName,


            location:
            job.location ?? "Remote",


            description:
            (job.body ?? "")
            .replace(/<[^>]+>/g," ")
            .replace(/\s+/g," ")
            .trim()
            .slice(0,4000),


            applyUrl:
            job.url ?? 
            `https://${token}.teamtailor.com/jobs`,


            postedAt:
            job.created_at

        }));



    }
    catch(error){


        console.log(
            `Teamtailor failed: ${companyName}`,
            error
        );


        return [];

    }

}