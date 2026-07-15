// services/appliedJobs.service.ts
import AppliedJob from "../models/Appliedjob";
import Job        from "../models/Job";

export async function markApplied(userId: string, jobId: string) {
  const existing = await AppliedJob.findOne({ user: userId, job: jobId });
  if (existing) return existing; // idempotent — no error if clicked twice

  const job = await Job.findById(jobId);
  if (!job) throw Object.assign(new Error("Job not found."), { status: 404 });

  return AppliedJob.create({ user: userId, job: jobId });
}

export async function unmarkApplied(userId: string, jobId: string) {
  const deleted = await AppliedJob.findOneAndDelete({ user: userId, job: jobId });
  if (!deleted) throw Object.assign(new Error("Not found in applied jobs."), { status: 404 });
  return deleted;
}

export async function getMyAppliedJobs(userId: string) {
  return AppliedJob.find({ user: userId })
    .populate({ path: "job", populate: { path: "company", select: "name logoUrl website" } })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getMyAppliedJobIds(userId: string): Promise<string[]> {
  const rows = await AppliedJob.find({ user: userId }).select("job").lean();
  return rows.map((r: any) => r.job.toString());
}