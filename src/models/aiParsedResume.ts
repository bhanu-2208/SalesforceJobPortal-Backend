import { z } from "zod";

// Every field is optional/nullable on purpose — the AI may not find a
// given section in a resume, and we don't want a partial parse to
// throw the whole request away. Fields not returned are simply left
// alone on the profile (existing implementation merges only what's
// present — see controller).

const experienceSchema = z.object({
  title: z.string().trim().default(""),
  company: z.string().trim().default(""),
  location: z.string().trim().optional(),
  from: z.string().trim().optional(), // "YYYY-MM" — kept as string, cast to Date on merge
  to: z.string().trim().optional(),
  current: z.boolean().optional(),
  description: z.string().trim().optional(),
});

const educationSchema = z.object({
  degree: z.string().trim().default(""),
  institution: z.string().trim().default(""),
  startYear: z.union([z.number(), z.string()]).optional(),
  endYear: z.union([z.number(), z.string()]).optional(),
  grade: z.string().trim().optional(),
});

const certificationSchema = z.object({
  name: z.string().trim().default(""),
  issuer: z.string().trim().optional(),
  issueDate: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
  credentialId: z.string().trim().optional(),
  credentialUrl: z.string().trim().optional(),
});

const linksSchema = z.object({
  linkedin: z.string().trim().optional(),
  github: z.string().trim().optional(),
  portfolio: z.string().trim().optional(),
  leetcode: z.string().trim().optional(),
  stackoverflow: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  other: z.string().trim().optional(),
});

export const aiParsedResumeSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(2000).optional(),
  phone: z.string().trim().optional(),
  location: z
    .object({
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      country: z.string().trim().optional(),
    })
    .optional(),

  currentDesignation: z.string().trim().optional(),
  currentCompany: z.string().trim().optional(),
  totalExperienceYears: z.union([z.number(), z.string()]).optional(),
  totalExperienceMonths: z.union([z.number(), z.string()]).optional(),

  salesforceSkills: z.array(z.string().trim()).optional(),
  skills: z.array(z.string().trim()).optional(),
  languages: z.array(z.string().trim()).optional(),

  trailheadUrl: z.string().trim().optional(),

  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),

  links: linksSchema.optional(),
});

export type AiParsedResume = z.infer<typeof aiParsedResumeSchema>;