import { Router } from "express";
import { getCandidates } from "../controllers/Candidates.controller";
import requireAuth from "../middlewares/requireAuth";
import { requireRecruiterOrAdmin } from "../middlewares/auth.middleware";
import { rankCandidatesByJD } from "../controllers/candidatesRankController";

const router = Router();

// Reuses the same middleware that already gates job posting — a
// recruiter or admin, nothing else, can search candidates.
router.get("/", requireAuth, requireRecruiterOrAdmin, getCandidates);
router.post("/rank-by-jd", requireAuth, requireRecruiterOrAdmin, rankCandidatesByJD);


export default router;