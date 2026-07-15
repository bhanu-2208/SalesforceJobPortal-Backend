// routes/company.routes.ts
import { Router } from "express";
import {
  getAllCompanies,
  getCompanyById,
  getJobsByCompany,
  createCompany,
} from "../controllers/companies.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/",         getAllCompanies);        // GET  /api/companies
router.get("/:id",      getCompanyById);         // GET  /api/companies/:id
router.get("/:id/jobs", getJobsByCompany);        // GET  /api/companies/:id/jobs
router.post("/",        requireAuth, createCompany); // POST /api/companies

export default router;