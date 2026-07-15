import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "user" | "admin" | "recruiter";
    isVerified: boolean;
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    name:{
        type:String,
        required:true,
        trim:true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },

    password:{
        type:String,
        required:true
    },

    role: {
        type: String,
        enum: ["user", "admin", "recruiter"],   // added "recruiter"
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        select: false,
    },
    otpExpiry: {
        type: Date,
        select: false,
    },
},
{
    timestamps:true
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;