import mongoose, { Schema, Document, Types } from "mongoose";

/* ────────────────────────────────────────────────────────────
   Sub-document interfaces
   ──────────────────────────────────────────────────────────── */

export interface IExperience {
  _id?: Types.ObjectId;
  title: string;
  company: string;
  location?: string;
  from: Date;
  to?: Date;
  current?: boolean;
  description?: string;
}

export interface IEducation {
  _id?: Types.ObjectId;
  degree: string;
  institution: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

export interface ICertification {
  _id?: Types.ObjectId;
  name: string;
  issuer?: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

export interface IProject {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  techStack?: string[];
  link?: string;
}

export type NoticePeriod = "immediate" | "15_days" | "30_days" | "60_days" | "90_days" | "other";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "freelance";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type AvatarKind = "preset" | "upload";

export interface IAvatar {
  kind: AvatarKind;
  value: string;
  publicId?: string;   // ← NEW — only set when kind is "upload"; presets don't have one  
}

export interface ILinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  leetcode?: string;
  stackoverflow?: string;
  twitter?: string;
  other?: string;
}

export interface IResume {
  fileName?: string;
  url?: string;
    publicId?: string;   // ← NEW — Cloudinary's identifier, needed to delete this file later
  uploadedAt?: Date;
}

export interface ILocation {
  city?: string;
  state?: string;
  country?: string;
}

/* ────────────────────────────────────────────────────────────
   Main Profile document
   ──────────────────────────────────────────────────────────── */

export interface IProfile extends Document {
  user: Types.ObjectId;
  avatar: IAvatar;

  headline?: string;
  summary?: string;
  phone?: string;
  alternatePhone?: string;
  dob?: Date;
  gender?: Gender;
  location: ILocation;

  currentDesignation?: string;
  currentCompany?: string;
  totalExperienceYears: number;
  totalExperienceMonths: number;
  noticePeriod: NoticePeriod;
  currentSalaryLPA?: number;
  expectedSalaryLPA?: number;
  employmentType: EmploymentType;
  willingToRelocate: boolean;

  salesforceSkills: string[];
  trailheadUrl?: string;
  trailheadRank?: string;
  trailheadBadgeCount?: number;

  skills: string[];
  languages: string[];

  experience: IExperience[];
  education: IEducation[];
  certifications: ICertification[];
  projects: IProject[];

  links: ILinks;
  resume?: IResume;

  isPublicToRecruiters: boolean;
  profileCompleteness: number;

  createdAt: Date;
  updatedAt: Date;
}

/* ────────────────────────────────────────────────────────────
   Sub-schemas
   ──────────────────────────────────────────────────────────── */

const ExperienceSchema = new Schema<IExperience>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    from: { type: Date, required: true },
    to: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: true }
);

const EducationSchema = new Schema<IEducation>(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    grade: { type: String, trim: true },
  },
  { _id: true }
);

const CertificationSchema = new Schema<ICertification>(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true, default: "Salesforce" },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
  },
  { _id: true }
);

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    techStack: [{ type: String, trim: true }],
    link: { type: String, trim: true },
  },
  { _id: true }
);

/* ────────────────────────────────────────────────────────────
   Main Profile schema
   ──────────────────────────────────────────────────────────── */

const ProfileSchema = new Schema<IProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    avatar: {
      type: {
        kind: { type: String, enum: ["preset", "upload"], default: "preset" },
        value: { type: String, default: "avatar-1" },
        publicId: { type: String },   // ← NEW
      },
      default: () => ({ kind: "preset", value: "avatar-1" }),
    },

    headline: { type: String, trim: true, maxlength: 120 },
    summary: { type: String, trim: true, maxlength: 2000 },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },

    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
    },

    currentDesignation: { type: String, trim: true },
    currentCompany: { type: String, trim: true },
    totalExperienceYears: { type: Number, min: 0, default: 0 },
    totalExperienceMonths: { type: Number, min: 0, max: 11, default: 0 },
    noticePeriod: {
      type: String,
      enum: ["immediate", "15_days", "30_days", "60_days", "90_days", "other"],
      default: "30_days",
    },
    currentSalaryLPA: { type: Number, min: 0 },
    expectedSalaryLPA: { type: Number, min: 0 },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "freelance"],
      default: "full_time",
    },
    willingToRelocate: { type: Boolean, default: false },

    salesforceSkills: [{ type: String, trim: true }],
    trailheadUrl: { type: String, trim: true },
    trailheadRank: { type: String, trim: true },
    trailheadBadgeCount: { type: Number, min: 0 },

    skills: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],

    experience: [ExperienceSchema],
    education: [EducationSchema],
    certifications: [CertificationSchema],
    projects: [ProjectSchema],

    links: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      portfolio: { type: String, trim: true },
      leetcode: { type: String, trim: true },
      stackoverflow: { type: String, trim: true },
      twitter: { type: String, trim: true },
      other: { type: String, trim: true },
    },

    resume: {
      fileName: { type: String, trim: true },
      url: { type: String, trim: true },
      uploadedAt: { type: Date },
        publicId: { type: String, trim: true },   // ← NEW
    },

    isPublicToRecruiters: { type: Boolean, default: true },
    profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

/* ────────────────────────────────────────────────────────────
   Compute a rough profile-completeness percentage before save.
   ──────────────────────────────────────────────────────────── */
ProfileSchema.pre("save", function (next) {
  const doc = this as IProfile;
  const checks = [
    !!doc.headline,
    !!doc.summary,
    !!doc.phone,
    !!doc.location?.city,
    !!doc.currentDesignation,
    (doc.salesforceSkills || []).length > 0,
    (doc.skills || []).length > 0,
    (doc.experience || []).length > 0,
    (doc.education || []).length > 0,
    (doc.certifications || []).length > 0,
    !!doc.links?.linkedin,
    !!doc.resume?.url,
  ]; 
  const done = checks.filter(Boolean).length;
  doc.profileCompleteness = Math.round((done / checks.length) * 100);
});

export default mongoose.model<IProfile>("Profile", ProfileSchema);