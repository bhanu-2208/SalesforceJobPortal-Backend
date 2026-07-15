// services/company.service.ts
import Company from "../models/Company";
import Job     from "../models/Job";

// ── Get all companies with real job counts ───────────────────────────
export async function getAllCompanies() {
  const companies = await Company.find().sort({ name: 1 }).lean();

  const withCounts = await Promise.all(
    companies.map(async (c) => {
      const jobCount = await Job.countDocuments({ company: c._id });
      return { ...c, jobCount };
    })
  );

  return withCounts;
}

// ── Get single company by id ──────────────────────────────────────────
export async function getCompanyById(id: string) {
  return Company.findById(id).lean();
}

// ── Get all jobs for a specific company ───────────────────────────────
export async function getJobsByCompany(
  companyId: string,
  filters: { workMode?: string; experienceLevel?: string; page?: number; limit?: number }
) {
  const page  = Math.max(1, filters.page  ?? 1);
  const limit = Math.min(50, filters.limit ?? 12);
  const skip  = (page - 1) * limit;

  const query: Record<string, any> = { company: companyId };
  if (filters.workMode)        query.workMode        = filters.workMode;
  if (filters.experienceLevel) query.experienceLevel = filters.experienceLevel;

  const [total, data] = await Promise.all([
    Job.countDocuments(query),
    Job.find(query)
      .sort({ postedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

// ── Create a company manually (rarely needed — auto-created via job posting) ──
export async function createCompany(input: { name: string; logoUrl?: string; website?: string }) {
  const existing = await Company.findOne({
    name: { $regex: `^${input.name.trim()}$`, $options: "i" },
  });
  if (existing) return existing;
  return Company.create(input);
}