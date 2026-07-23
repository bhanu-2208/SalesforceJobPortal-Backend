import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireAdmin, requireRecruiterOrAdmin } from "../middlewares/auth.middleware";
import { getJobs, getJobBySlug, createJob, updateJob, deleteJob, seedJobs } from "../controllers/jobs.controller";
import { generateJob } from "../controllers/aiJob.controller";

const router = Router();
const aiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

router.get("/",          getJobs);
router.get("/seed",      seedJobs);          // GET /api/jobs/seed — run once to insert dummy data
router.post("/generate", aiLimiter, requireAuth, generateJob);
router.get("/:slug",     getJobBySlug);
router.post("/",         requireAuth, requireRecruiterOrAdmin, createJob);
router.put("/:id",       requireAuth, updateJob);
router.delete("/:id",    requireAuth, deleteJob);
export default router;