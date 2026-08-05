import mongoose, { Schema, Document, Types } from "mongoose";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

export type WorkMode = "Remote" | "Hybrid" | "Onsite";
export type ExperienceLevel = "0 Years" | "1-2 Years" | "2-6 Years" | "6-8 Years" | "8-12 Years" | "12+ Years";
export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";

export interface ISalary {
  min?: number;
  max?: number;
  currency?: string;
}

export interface IJob extends Document {
  title: string;
  slug: string;
  description: string;
  location?: string;
  country?: string;
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  roleCategory?: string;
  skills: string[];
  salary?: ISalary;
  employmentType?: EmploymentType;
  applyUrl: string;
  sourceId?: string;
  source?:string;
  postedAt?: Date;
  expiresAt?: Date;
  company?: Types.ObjectId; // ref: Company
  postedBy: Types.ObjectId; // ref: User — owner, used for delete permission
  createdAt: Date;
  updatedAt: Date;
  overview?: string;
  responsibilities?: string[];
  requirements?: string[];
  preferredQualifications?: string[];
  benefits?: string[];
  salesforceProducts?: string[];
  certifications?: string[];
}

/* ────────────────────────────────────────────────────────────
   Schema
   ──────────────────────────────────────────────────────────── */

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    location: { type: String, trim: true },
    country: { type: String, trim: true },
    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "Onsite"],
        default: "Onsite",
    },
    experienceLevel: {
      type: String,
      enum: ["0 Years", "1-2 Years", "2-6 Years", "6-8 Years", "8-12 Years", "12+ Years"],
    },
    roleCategory: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    salary: {
      min: Number,
      max: Number,
      currency: String,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
    },
    applyUrl: { type: String, required: true },
    source: { type: String },
    postedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    sourceId: {
      type: String,
      index: true,   // speeds up duplicate-check queries
    },
    overview:                 { type: String },
    responsibilities:         [{ type: String }],
    requirements:             [{ type: String }],
    preferredQualifications:  [{ type: String }],
    benefits:                 [{ type: String }],
    salesforceProducts:       [{ type: String }],
    certifications:           [{ type: String }]
    },
  { timestamps: true }
);

/* ────────────────────────────────────────────────────────────
   Slug generation
   ──────────────────────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Auto-generate a slug from the title before validation runs, and
// guarantee it's unique — "Salesforce Developer" posted twice would
// otherwise collide on the unique index and the second post would
// fail with a raw MongoServerError instead of a clean error message.
//
// This has to be a real pre("validate") hook (not a plain function
// call) because it needs to `await` a DB query — `this.constructor`
// is the Job model itself, typed loosely here since Mongoose's own
// typings for "the model of the document currently being validated"
// don't thread through cleanly with `strict: false`.
jobSchema.pre("validate", async function () {
  if (this.slug || !this.title) return ;

  const base = slugify(this.title);
  let candidate = base;
  let suffix = 1;

  const JobModel = this.constructor as mongoose.Model<IJob>;
  while (await JobModel.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  this.slug = candidate;
});

export default mongoose.model<IJob>("Job", jobSchema);