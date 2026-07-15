// controllers/company.controller.ts
import { Request, Response } from "express";
import * as CompanyService from "../services/Company.service";

// GET /api/companies
export async function getAllCompanies(req: Request, res: Response): Promise<void> {
  try {
    const data = await CompanyService.getAllCompanies();
    res.status(200).json({ success: true, data, total: data.length });
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
}

// GET /api/companies/:id
export async function getCompanyById(req: Request, res: Response): Promise<void> {
  try {
    const company = await CompanyService.getCompanyById(req.params.id as string);
    if (!company) {
      res.status(404).json({ success: false, message: "Company not found." });
      return;
    }
    res.status(200).json({ success: true, data: company });
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
}

// GET /api/companies/:id/jobs
export async function getJobsByCompany(req: Request, res: Response): Promise<void> {
  try {
    const { workMode, experienceLevel, page, limit } = req.query;
    const result = await CompanyService.getJobsByCompany(req.params.id as string, {
      workMode:        workMode        as string,
      experienceLevel: experienceLevel as string,
      page:  page  ? parseInt(page  as string) : 1,
      limit: limit ? parseInt(limit as string) : 12,
    });
    res.status(200).json({ success: true, ...result });
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
}

// POST /api/companies  (rarely used directly — companies auto-create on job posting)
export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const { name, logoUrl, website } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Company name is required." });
      return;
    }
    const company = await CompanyService.createCompany({ name, logoUrl, website });
    res.status(201).json({ success: true, data: company });
    return;
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }
}