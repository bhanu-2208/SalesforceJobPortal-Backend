import ATSCompany from "../models/ATSCompany";

import {
    fetchFromGreenhouse
} from "./greenhouse.importer";

import {
    fetchFromLever
} from "./lever.importer";

import {
    fetchFromAshby
} from "./ashby.importer";


export async function fetchCompanyJobs(){

    const companies =
        await ATSCompany.find({
            active:true
        }).lean();


    let jobs:any[] = [];


    for(const company of companies){

        try {

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


                default:

                    // console.log(
                    //     `Unsupported ATS: ${company.ats}`
                    // );

                    continue;
            }



            jobs.push(...result);



            // console.log(
            //     `${company.name}: ${result.length} jobs`
            // );


        } catch(error){

            // console.log(
            //     `Failed ${company.name}`,
            //     error
            // );

        }

    }


    return jobs;

}