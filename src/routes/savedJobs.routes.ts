import { Router }    from "express";
import { saveJob, unsaveJob, getSavedJobs, getSavedJobIds } from "../controllers/savedJobs.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All saved-jobs routes require login
router.use(requireAuth);

router.get("/",          getSavedJobs);    // GET  /api/saved-jobs
router.get("/ids",       getSavedJobIds);  // GET  /api/saved-jobs/ids
router.post("/:jobId",   saveJob);         // POST /api/saved-jobs/:jobId
router.delete("/:jobId", unsaveJob);       // DELETE /api/saved-jobs/:jobId

export default router;