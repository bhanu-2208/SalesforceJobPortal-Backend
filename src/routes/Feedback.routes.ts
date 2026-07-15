// routes/feedback.routes.ts
import { Router } from "express";
import {
  createFeedback,
  getAllFeedback,
  getMyFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from "../controllers/Feedback.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All feedback routes require login
router.use(requireAuth);

router.post("/",              createFeedback);                  // POST   /api/feedback
router.get("/mine",           getMyFeedback);                   // GET    /api/feedback/mine
router.get("/",               requireAdmin, getAllFeedback);    // GET    /api/feedback (admin)
router.patch("/:id/status",   requireAdmin, updateFeedbackStatus); // PATCH /api/feedback/:id/status (admin)
router.delete("/:id",         requireAdmin, deleteFeedback);    // DELETE /api/feedback/:id (admin)

export default router;