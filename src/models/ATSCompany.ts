import mongoose, { Schema, Document } from "mongoose";


export interface IATSCompany extends Document {

    name: string;

    ats:
        | "greenhouse"
        | "lever"
        | "ashby"
        | "smartrecruiters"
        | "teamtailor";

    token: string;

    active: boolean;
}


const ATSCompanySchema =
new Schema<IATSCompany>(

{

    name:{
        type:String,
        required:true,
        unique:true
    },


    ats:{
        type:String,
        required:true
    },


    token:{
        type:String,
        required:true
    },


    active:{
        type:Boolean,
        default:true
    }

},

{
    timestamps:true
});


export default mongoose.model<IATSCompany>(
    "ATSCompany",
    ATSCompanySchema
);