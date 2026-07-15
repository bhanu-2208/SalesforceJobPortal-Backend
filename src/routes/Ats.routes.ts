import { Router } from "express";
import { getAtsScore } from "../controllers/Atscontroller.controller";
import requireAuth from "../middlewares/requireAuth";

const router = Router();

router.get("/:jobId", requireAuth, getAtsScore);

export default router;