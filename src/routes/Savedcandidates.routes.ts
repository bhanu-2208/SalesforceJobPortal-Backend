import { Router } from "express";
import { saveCandidate, unsaveCandidate, getSavedCandidateIds } from "../controllers/Savedcandidates.controller";
import requireAuth from "../middlewares/requireAuth";
import { requireRecruiterOrAdmin } from "../middlewares/auth.middleware";

const router = Router();

router.get("/ids", requireAuth, requireRecruiterOrAdmin, getSavedCandidateIds);
router.post("/:candidateId", requireAuth, requireRecruiterOrAdmin, saveCandidate);
router.delete("/:candidateId", requireAuth, requireRecruiterOrAdmin, unsaveCandidate);

export default router;