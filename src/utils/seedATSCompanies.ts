import mongoose from "mongoose";
import ATSCompany from "../models/ATSCompany";
import companies from "../config/companies.json";


async function seed(){

    await mongoose.connect(
        process.env.MONGO_URI!
    );


    await ATSCompany.deleteMany({});


    await ATSCompany.insertMany(
        companies.map(company=>({
            ...company,
            active:true
        }))
    );


    console.log(
        "ATS Companies inserted"
    );


    process.exit();

}


seed();