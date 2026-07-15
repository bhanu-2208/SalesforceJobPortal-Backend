// routes/appliedJobs.routes.ts
import { Router } from "express";
import {
  markApplied, unmarkApplied, getMyAppliedJobs, getMyAppliedJobIds,
} from "../controllers/Appliedjobs.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/",         getMyAppliedJobs);     // GET    /api/applied-jobs
router.get("/ids",      getMyAppliedJobIds);   // GET    /api/applied-jobs/ids
router.post("/:jobId",  markApplied);          // POST   /api/applied-jobs/:jobId
router.delete("/:jobId",unmarkApplied);        // DELETE /api/applied-jobs/:jobId

export default router;