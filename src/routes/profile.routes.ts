import { Router } from "express";

import {
  getMyProfile,
  getPublicProfile,
  upsertMyProfile,
  setPresetAvatar,
  uploadAvatarFile,
  uploadResume,
  deleteResume,
} from "../controllers/profile.controller";

import { uploadResume as resumeUpload, uploadAvatar as avatarUpload } from "../middlewares/upload";
import { parseResumeWithAI } from "../controllers/profile.controller";

// Swap this import for whatever your existing auth middleware is called.
// It just needs to set `req.user = { id, role }` from the JWT/cookie.
import requireAuth from "../middlewares/requireAuth";
import { requireRecruiterOrAdmin } from "../middlewares/auth.middleware";

const router = Router();

// ── Own profile (must be logged in) ──────────────────────────
router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, upsertMyProfile);

router.put("/me/avatar", requireAuth, setPresetAvatar);
router.post("/me/avatar/upload", requireAuth, avatarUpload.single("avatar"), uploadAvatarFile);

router.post("/me/resume", requireAuth, resumeUpload.single("resume"), uploadResume);
router.delete("/me/resume", requireAuth, deleteResume);

// ── Recruiter-facing read of a candidate profile ─────────────
router.get("/:userId", requireAuth,requireRecruiterOrAdmin, getPublicProfile);
router.post("/me/resume/parse", requireAuth, resumeUpload.single("resume"), parseResumeWithAI);



export default router;