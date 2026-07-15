import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISavedCandidate extends Document {
  recruiter: Types.ObjectId; // the User (role: recruiter/admin) who saved this
  candidate: Types.ObjectId; // the User (role: user) being saved — same id used by GET /api/profile/:userId
  note?: string;             // private note only the recruiter sees, e.g. "good fit for Q2 req"
  createdAt: Date;
  updatedAt: Date;
}

const SavedCandidateSchema = new Schema<ISavedCandidate>(
  {
    recruiter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// A recruiter can only save a given candidate once — calling "save"
// again on someone already saved should update, not duplicate.
SavedCandidateSchema.index({ recruiter: 1, candidate: 1 }, { unique: true });

export default mongoose.model<ISavedCandidate>("SavedCandidate", SavedCandidateSchema);