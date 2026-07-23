// import { RawExternalJob } from "./types";
// import { mapWithConcurrencyLimit } from "./concurrency";

// const SMARTRECRUITERS_COMPANIES = [
//   "visa",
//   "uber",
//   "epam",
//   "bosch",
//   "nokia",
//   "cisco",
//   "philips",
//   "adidas",
//   "ikea",
//   "volvo",
//   "wipro",
//   "capgemini",
//   "publicissapient",
//   "siemens",
// ];

// const MAX_CONCURRENT_REQUESTS = 8;

// async function fetchCompanyJobs(company: string): Promise<RawExternalJob[]> {
//   try {
//     const res = await fetch(
//       `https://api.smartrecruiters.com/v1/companies/${company}/postings`
//     );
//     if (!res.ok) return [];

//     const data = await res.json();
//     const jobs = data.content || [];

//     return jobs
//       .filter((j: any) => j.name?.toLowerCase().includes("salesforce"))
//       .map((j: any) => ({
//         sourceId: `smart-${j.id}`,
//         source: "SmartRecruiters",
//         title: j.name,
//         companyName: company.charAt(0).toUpperCase() + company.slice(1),
//         location: j.location?.city,
//         description: "",
//         applyUrl: j.ref,
//         postedAt: j.releasedDate,
//       }));
//   } catch {
//     return [];
//   }
// }

// export async function fetchFromSmartRecruiters(): Promise<RawExternalJob[]> {
//   const perCompanyResults = await mapWithConcurrencyLimit(
//     SMARTRECRUITERS_COMPANIES,
//     MAX_CONCURRENT_REQUESTS,
//     fetchCompanyJobs
//   );

//   return perCompanyResults.flat();
// }

import { RawExternalJob } from "./types";


export async function fetchFromSmartRecruiters(
    token: string,
    companyName: string
): Promise<RawExternalJob[]> {


    const jobs: RawExternalJob[] = [];


    try {


        const res = await fetch(
            `https://api.smartrecruiters.com/v1/companies/${token}/postings`
        );


        if(!res.ok){

            console.log(
                `SmartRecruiters unavailable: ${companyName}`
            );

            return [];

        }



        const data = await res.json();


        const postings = data.content || [];



        for(const job of postings){


            const description =
            job.jobAd?.sections
            ?.map((section:any)=>section.text)
            ?.join("\n")
            ??
            "";



            jobs.push({

                sourceId:
                `smart-${job.id}`,


                source:
                "SmartRecruiters",


                title:
                job.name,


                companyName,


                location:
                job.location?.city ??
                "Remote",


                description:
                description
                .replace(/<[^>]+>/g," ")
                .slice(0,4000),


                applyUrl:
                job.ref,


                postedAt:
                job.releasedDate

            });


        }


    }
    catch(error){

        console.log(
            `SmartRecruiters failed: ${companyName}`,
            error
        );

    }



    return jobs;

}