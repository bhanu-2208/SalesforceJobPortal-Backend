// models/AppliedJob.ts
import mongoose from "mongoose";

const appliedJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job:  { type: mongoose.Schema.Types.ObjectId, ref: "Job",  required: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One user can only mark "applied" once per job
appliedJobSchema.index({ user: 1, job: 1 }, { unique: true });

export default mongoose.model("AppliedJob", appliedJobSchema);