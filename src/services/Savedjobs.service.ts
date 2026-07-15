import SavedJob from "../models/SavedJob";
import Job      from "../models/Job";

// ── Save a job ───────────────────────────────────────────────────────
export async function saveJob(userId: string, jobId: string) {
  const existing = await SavedJob.findOne({ user: userId, job: jobId });
  if (existing) {
    throw Object.assign(new Error("Job already saved."), { status: 409 });
  }
  // Verify job exists
  const job = await Job.findById(jobId);
  if (!job) throw Object.assign(new Error("Job not found."), { status: 404 });

  const saved = await SavedJob.create({ user: userId, job: jobId });
  return saved;
}

// ── Unsave a job ─────────────────────────────────────────────────────
export async function unsaveJob(userId: string, jobId: string) {
  const result = await SavedJob.findOneAndDelete({ user: userId, job: jobId });
  if (!result) throw Object.assign(new Error("Saved job not found."), { status: 404 });
  return result;
}

// ── Get all saved jobs for a user ────────────────────────────────────
export async function getSavedJobs(userId: string) {
  return SavedJob.find({ user: userId })
    .populate({
      path: "job",
      populate: { path: "company", select: "name logo website" },
    })
    .sort({ createdAt: -1 })
    .lean();
}

// ── Check if a specific job is saved ────────────────────────────────
export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const found = await SavedJob.findOne({ user: userId, job: jobId });
  return !!found;
}

// ── Get saved job IDs for a user (for bulk checking) ────────────────
export async function getSavedJobIds(userId: string): Promise<string[]> {
  const saved = await SavedJob.find({ user: userId }).select("job").lean();
  return saved.map((s: any) => s.job.toString());
}