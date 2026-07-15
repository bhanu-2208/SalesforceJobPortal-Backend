import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAtsCheck extends Document {
  user: Types.ObjectId;
  job: Types.ObjectId;
  resumeUploadedAt: Date; // used to invalidate cache when the resume changes
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const AtsCheckSchema = new Schema<IAtsCheck>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    resumeUploadedAt: { type: Date, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    matchedKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    suggestions: [{ type: String }],
    summary: { type: String },
  },
  { timestamps: true }
);

// One cached result per (user, job) pair — re-running the same check
// overwrites it rather than creating duplicates.
AtsCheckSchema.index({ user: 1, job: 1 }, { unique: true });

export default mongoose.model<IAtsCheck>("AtsCheck", AtsCheckSchema);