import { z } from "zod";

// Mirrors IProfile's editable fields (models/Profile.ts). Kept separate
// from the Mongoose schema on purpose — this validates the *shape of
// the request body* before it ever reaches the DB layer.

const locationSchema = z.object({
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

const experienceSchema = z.object({
  title: z.string().trim().min(1, "Job title is required"),
  company: z.string().trim().min(1, "Company is required"),
  location: z.string().trim().optional(),
  from: z.coerce.date(),
  to: z.coerce.date().optional().nullable(),
  current: z.boolean().optional(),
  description: z.string().trim().max(2000).optional(),
});

const educationSchema = z.object({
  degree: z.string().trim().min(1, "Degree is required"),
  institution: z.string().trim().min(1, "Institution is required"),
  startYear: z.coerce.number().int().optional(),
  endYear: z.coerce.number().int().optional(),
  grade: z.string().trim().optional(),
});

const certificationSchema = z.object({
  name: z.string().trim().min(1, "Certification name is required"),
  issuer: z.string().trim().optional(),
  issueDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  credentialId: z.string().trim().optional(),
  credentialUrl: z.string().trim().url().optional().or(z.literal("")),
});

const linksSchema = z.object({
  linkedin: z.string().trim().url().optional().or(z.literal("")),
  github: z.string().trim().url().optional().or(z.literal("")),
  portfolio: z.string().trim().url().optional().or(z.literal("")),
  leetcode: z.string().trim().url().optional().or(z.literal("")),
  stackoverflow: z.string().trim().url().optional().or(z.literal("")),
  twitter: z.string().trim().url().optional().or(z.literal("")),
  other: z.string().trim().url().optional().or(z.literal("")),
});

export const upsertProfileSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(2000).optional(),
  phone: z.string().trim().optional(),
  alternatePhone: z.string().trim().optional(),
  dob: z.coerce.date().optional().nullable(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  location: locationSchema.optional(), 

  currentDesignation: z.string().trim().optional(),
  currentCompany: z.string().trim().optional(),
  totalExperienceYears: z.coerce.number().min(0).optional(),
  totalExperienceMonths: z.coerce.number().min(0).max(11).optional(),
  noticePeriod: z.enum(["immediate", "15_days", "30_days", "60_days", "90_days", "other"]).optional(),
  currentSalaryLPA: z.coerce.number().min(0).optional(),
  expectedSalaryLPA: z.coerce.number().min(0).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).optional(),
  willingToRelocate: z.boolean().optional(),

  salesforceSkills: z.array(z.string().trim()).optional(),
  trailheadUrl: z.string().trim().url().optional().or(z.literal("")),
  trailheadRank: z.string().trim().optional(),
  trailheadBadgeCount: z.coerce.number().min(0).optional(),

  skills: z.array(z.string().trim()).optional(),
  languages: z.array(z.string().trim()).optional(),

  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),

  links: linksSchema.optional(),
  isPublicToRecruiters: z.boolean().optional(),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;

export const setPresetAvatarSchema = z.object({
  value: z.string().trim().min(1, "Missing avatar value"),
});