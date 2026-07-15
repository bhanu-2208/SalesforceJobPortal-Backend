import mongoose from "mongoose";

const companySchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    website:{
        type:String
    },

    logoUrl:{
        type:String
    },

    industry:{
        type:String
    },

    headquarters:{
        type:String
    },

    description:{
        type:String
    },
    jobCount: {
        type: Number,
        default: 0,
    },

},{
    timestamps:true
});

export default mongoose.model("Company",companySchema);