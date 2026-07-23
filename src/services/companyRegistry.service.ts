import ATSCompany from "../models/ATSCompany";
import companies from "../config/companies.json";


export async function seedATSCompanies(){

    for(const company of companies){


        await ATSCompany.findOneAndUpdate(

            {
                name:company.name
            },


            {
                name:company.name,
                ats:company.ats,
                token:company.token,
                active:true
            },


            {
                upsert:true
            }

        );

    }


    console.log(
        `✅ ATS companies loaded: ${companies.length}`
    );

}