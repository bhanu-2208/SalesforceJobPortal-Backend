import ATSCompany from "../models/ATSCompany";

import { fetchFromGreenhouse } from "../importers/greenhouse.importer";
import { fetchFromLever } from "../importers/lever.importer";
import { fetchFromAshby } from "../importers/ashby.importer";
import { fetchFromSmartRecruiters } from "../importers/smartrecruiters.importer";
import { fetchFromTeamtailor } from "../importers/teamtailor.importer";


export async function fetchCompanyJobs(){


    const companies =
    await ATSCompany.find({
        active:true
    }).lean();



    let jobs:any[] = [];



    for(const company of companies){


        try{


            let result:any[] = [];



            switch(company.ats){


                case "greenhouse":

                    result =
                    await fetchFromGreenhouse(
                        company.token,
                        company.name
                    );

                    break;



                case "lever":

                    result =
                    await fetchFromLever(
                        company.token,
                        company.name
                    );

                    break;



                case "ashby":

                    result =
                    await fetchFromAshby(
                        company.token,
                        company.name
                    );

                    break;



                case "smartrecruiters":

                    result =
                    await fetchFromSmartRecruiters(
                        company.token,
                        company.name
                    );

                    break;



                case "teamtailor":

                    result =
                    await fetchFromTeamtailor(
                        company.token,
                        company.name
                    );

                    break;


            }



            jobs.push(...result);



            console.log(
                `${company.name}: ${result.length} jobs`
            );


        }
        catch(error){

            console.log(
                `Failed ${company.name}`,
                error
            );

        }


    }



    return jobs;

}