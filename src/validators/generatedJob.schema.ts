// validators/generatedJob.schema.ts
import { z } from "zod";

export const GeneratedJobSchema = z.object({
  title:            z.string().min(1),
  companyName:      z.string().nullable().optional(),
  companyLogo:      z.string().nullable().optional(),
  location:         z.string().nullable().optional(),
  country:          z.string().nullable().optional(),
  workMode:         z.enum(["Remote", "Hybrid", "Onsite"]).nullable().optional(),
  employmentType:   z.enum(["Full-time", "Part-time", "Contract", "Internship"]).nullable().optional(),
  experienceLevel:  z.enum(["0 Years" , "1-2 Years" , "2-6 Years" , "6-8 Years" , "8-12 Years" , "12+ Years"]).nullable().optional(),
  roleCategory:     z.string().nullable().optional(),

  salaryMin:        z.number().nullable().optional(),
  salaryMax:        z.number().nullable().optional(),
  currency:         z.string().nullable().optional(),
  skills:           z.array(z.string()).default([]),
  certifications:   z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  requirements:     z.array(z.string()).default([]),
  benefits:         z.array(z.string()).default([]),
  description:      z.string().min(1),
  applyUrl:         z.string().nullable().optional(),
});

export type GeneratedJob = z.infer<typeof GeneratedJobSchema>;