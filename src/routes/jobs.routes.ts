import { Router } from "express";
import { requireAuth, requireAdmin, requireRecruiterOrAdmin } from "../middlewares/auth.middleware";
import { getJobs, getJobBySlug, createJob, updateJob, deleteJob, seedJobs } from "../controllers/jobs.controller";
import { generateJob } from "../controllers/aiJob.controller";

const router = Router();

router.get("/",          getJobs);
router.get("/seed",      seedJobs);          // GET /api/jobs/seed — run once to insert dummy data
router.post("/generate", requireAuth, generateJob);
router.get("/:slug",     getJobBySlug);
router.post("/",         requireAuth, requireRecruiterOrAdmin, createJob);
router.put("/:id",       requireAuth, updateJob);
router.delete("/:id",    requireAuth, deleteJob);
export default router;