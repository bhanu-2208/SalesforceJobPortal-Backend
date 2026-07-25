import { Request, Response } from "express";
import Profile from "../models/Profile";
import cloudinary from "../config/cloudinary";
import { upsertProfileSchema, setPresetAvatarSchema } from "../validators/Profilevalidation";
import type { AvatarKind } from "../models/Profile";
import { extractResumeTextFromUrl } from "../services/resumeTextExtract.service";
import { parseResumeText } from "../services/aiResumeExtract.service";
import type { AiParsedResume } from "../models/aiParsedResume";

// ── GET /api/profile/me ─────────────────────────────────────
// Returns the caller's profile, creating an empty shell the
// first time so the frontend always has something to render.
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const useruserId = req.user!.userId;
    let profile = await Profile.findOne({ user: useruserId });
    if (!profile) {
      // console.log("req.user =", req.user);
      // console.log("userId =", req.user?.userId);
      // console.log("creating profile...");
      profile = await Profile.create({ user: useruserId });
    }
    res.json({ success: true, profile });
  } catch (err) {
    // console.error("getMyProfile error:", err);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

function monthStringToDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const [, year, month] = match;
  return new Date(Number(year), Number(month) - 1, 1);
}

function mergeParsedResumeIntoProfile(profile: any, parsed: AiParsedResume): void {
  if (parsed.headline) profile.headline = parsed.headline;
  if (parsed.summary) profile.summary = parsed.summary;
  if (parsed.phone) profile.phone = parsed.phone;
 
  if (parsed.location) {
    profile.location = {
      city: parsed.location.city || profile.location?.city,
      state: parsed.location.state || profile.location?.state,
      country: parsed.location.country || profile.location?.country || "India",
    };
  }
 
  if (parsed.currentDesignation) profile.currentDesignation = parsed.currentDesignation;
  if (parsed.currentCompany) profile.currentCompany = parsed.currentCompany;
  if (parsed.totalExperienceYears !== undefined) profile.totalExperienceYears = Number(parsed.totalExperienceYears) || 0;
  if (parsed.totalExperienceMonths !== undefined) profile.totalExperienceMonths = Number(parsed.totalExperienceMonths) || 0;
 
  if (parsed.salesforceSkills?.length) profile.salesforceSkills = parsed.salesforceSkills;
  if (parsed.skills?.length) profile.skills = parsed.skills;
  if (parsed.languages?.length) profile.languages = parsed.languages;
  if (parsed.trailheadUrl) profile.trailheadUrl = parsed.trailheadUrl;
 
  if (parsed.experience?.length) {
    profile.experience = parsed.experience.map((e) => ({
      title: e.title || "",
      company: e.company || "",
      location: e.location || "",
      from: monthStringToDate(e.from) || new Date(),
      to: e.current ? undefined : monthStringToDate(e.to),
      current: !!e.current,
      description: e.description || "",
    }));
  }
 
  if (parsed.education?.length) {
    profile.education = parsed.education.map((ed) => ({
      degree: ed.degree || "",
      institution: ed.institution || "",
      startYear: ed.startYear ? Number(ed.startYear) : undefined,
      endYear: ed.endYear ? Number(ed.endYear) : undefined,
      grade: ed.grade || "",
    }));
  }
 
  if (parsed.certifications?.length) {
    profile.certifications = parsed.certifications.map((c) => ({
      name: c.name || "",
      issuer: c.issuer || "Salesforce",
      issueDate: monthStringToDate(c.issueDate),
      expiryDate: monthStringToDate(c.expiryDate),
      credentialId: c.credentialId || "",
      credentialUrl: c.credentialUrl || "",
    }));
  }
 
  if (parsed.links) {
    profile.links = {
      linkedin: parsed.links.linkedin || profile.links?.linkedin || "",
      github: parsed.links.github || profile.links?.github || "",
      portfolio: parsed.links.portfolio || profile.links?.portfolio || "",
      leetcode: parsed.links.leetcode || profile.links?.leetcode || "",
      stackoverflow: parsed.links.stackoverflow || profile.links?.stackoverflow || "",
      twitter: profile.links?.twitter || "",
      other: profile.links?.other || "",
    };
  }
}

export const parseResumeWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
 
    const userId = req.user!.userId;
 
    // Step 1 — extract text from the uploaded file
    let resumeText: string;
    try {
      // console.log(req.file)
      resumeText = await extractResumeTextFromUrl(req.file.path); // req.file.path is now the Cloudinary URL
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Could not read that resume file.",
      });
      return;
    }
 
    // Step 2 — ask Gemini to structure it
    // Step 2 — ask Gemini to structure it (with automatic retries)
let parsed: AiParsedResume;

try {
  let retries = 3;

  while (true) {
    try {
      // console.log("Calling Gemini...");

      parsed = await parseResumeText(resumeText);

        // console.log("Gemini parsing successful.");
        break;
      } catch (err: any) {
        const message = err?.message || "";

        const shouldRetry =
          err?.status === 503 ||
          message.includes("503") ||
          message.includes("Service Unavailable") ||
          message.includes("high demand");

        if (!shouldRetry || retries === 0) {
          throw err;
        }

        // console.log(
        //   `Gemini is busy. Retrying... (${4 - retries}/3)`
        // );

        retries--;

        await new Promise((resolve) =>
          setTimeout(resolve, (4 - retries) * 2000)
        );
      }
    }
    } catch (err: any) {
      // console.error("Gemini Error:", err);

      res.status(503).json({
        success: false,
        message:
          "Gemini is currently experiencing high demand. Please try again in a minute.",
      });
      return;
    }
 
    // Step 3 — merge onto the profile and save
    let profile = await Profile.findOne({ user: userId });
    if (!profile) profile = new Profile({ user: userId });
 
    mergeParsedResumeIntoProfile(profile, parsed);
 
    // Also record the resume file itself, same as the plain upload endpoint
    profile.resume = {
      fileName: req.file.originalname,
      url: req.file.path,           // Cloudinary secure_url
      publicId: req.file.filename,  // Cloudinary public_id, for future cleanup
      uploadedAt: new Date(),
    };
 
 
    await profile.save(); // triggers pre-save hook → recomputes profileCompleteness
 
    res.json({
      success: true,
      profile,
      message: "Resume parsed — please review each section before saving.",
    });
  } catch (err: any) {
    // console.error("========== PARSE RESUME ERROR ==========");
    // console.error(err);

    res.status(500).json({
      success: false,
      message: err.message || "Something went wrong while parsing your resume.",
    });
  }
};

// ── GET /api/profile/:useruserId ────────────────────────────────
// Recruiter-facing read of a canduserIdate's profile.
export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await Profile.findOne({
      user: req.params.useruserId,
      isPublicToRecruiters: true,
    }).populate("user", "name email role");

    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }
    res.json({ success: true, profile });
  } catch (err) {
    // console.error("getPublicProfile error:", err);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

// ── PUT /api/profile/me ──────────────────────────────────────
// Upsert — works whether the profile exists yet or not, and
// whether the user is filling this in for the first time or
// editing something they already filled in. Body is valuserIdated
// with zod before touching Mongoose.
export const upsertMyProfile = async (req: Request, res: Response): Promise<void> => {
  const parsed = upsertProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "InvaluserId profile data",
      errors: parsed.error.flatten(),
    });
    return;
  }

  try {
    const useruserId = req.user!.userId;
    const profile = await Profile.findOneAndUpdate(
      { user: useruserId },
      { $set: parsed.data },
      { new: true, upsert: true, runValuserIdators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, profile });
  } catch (err: any) {
    // console.error("upsertMyProfile error:", err);
    if (err?.name === "ValuserIdationError") {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to save profile" });
  }
};

// ── PUT /api/profile/me/avatar ───────────────────────────────
// Body: { value: "avatar-3" } — sets a preset (cartoon) avatar.
export const setPresetAvatar = async (req: Request, res: Response): Promise<void> => {
  const parsed = setPresetAvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Missing avatar value" });
    return;
  }

  try {
    const useruserId = req.user!.userId;
    const profile = await Profile.findOneAndUpdate(
      { user: useruserId },
      { $set: { avatar: { kind: "preset" as AvatarKind, value: parsed.data.value } } },
      { new: true, upsert: true }
    );

    res.json({ success: true, avatar: profile.avatar });
  } catch (err) {
    // console.error("setPresetAvatar error:", err);
    res.status(500).json({ success: false, message: "Failed to set avatar" });
  }
};

// ── POST /api/profile/me/avatar/upload ───────────────────────
// multipart/form-data, field name "avatar" — parsed by
// muserIddleware/upload.ts's uploadAvatar before this runs.
export const uploadAvatarFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
 
    const userId = req.user!.userId;
 
    // With CloudinaryStorage, req.file.path is the Cloudinary secure_url
    // and req.file.filename is the public_id — NOT a local file path
    // anymore, even though the property is still called `.path` (that's
    // just how multer-storage-cloudinary reports it, to stay compatible
    // with code written for disk storage).
    const newUrl = req.file.path;
    const newPublicId = req.file.filename;
 
    const existing = await Profile.findOne({ user: userId });
 
    // Clean up the previous uploaded avatar (not presets — those have
    // no Cloudinary file to delete) so re-uploading doesn't silently
    // pile up storage forever.
    if (existing?.avatar?.kind === "upload" && existing.avatar.publicId) {
      await cloudinary.uploader.destroy(existing.avatar.publicId, { resource_type: "image" }).catch(() => {
        // Non-fatal — the new avatar still saves even if the old
        // Cloudinary file was already gone or the delete call failed.
      });
    }
 
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: { avatar: { kind: "upload" as AvatarKind, value: newUrl, publicId: newPublicId } } },
      { new: true, upsert: true }
    );
 
    res.json({ success: true, avatar: profile.avatar });
  } catch (err) {
    // console.error("uploadAvatarFile error:", err);
    res.status(500).json({ success: false, message: "Failed to upload avatar" });
  }
};

// ── POST /api/profile/me/resume ──────────────────────────────
// multipart/form-data, field name "resume" — parsed by
// muserIddleware/upload.ts's uploadResume before this runs.
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
 
    const userId = req.user!.userId;
    const newUrl = req.file.path;       // Cloudinary secure_url
    const newPublicId = req.file.filename; // Cloudinary public_id
 
    const existing = await Profile.findOne({ user: userId });
 
    // Same cleanup pattern as the avatar — delete the old resume file
    // from Cloudinary before/while saving the new one.
    if (existing?.resume?.publicId) {
      await cloudinary.uploader.destroy(existing.resume.publicId, { resource_type: "raw" }).catch(() => {});
    }
 
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          resume: {
            fileName: req.file.originalname,
            url: newUrl,
            publicId: newPublicId,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );
 
    res.json({ success: true, resume: profile.resume });
  } catch (err) {
    // console.error("uploadResume error:", err);
    res.status(500).json({ success: false, message: "Failed to upload resume" });
  }
};

// ── DELETE /api/profile/me/resume ────────────────────────────
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const existing = await Profile.findOne({ user: userId });
 
    if (existing?.resume?.publicId) {
      await cloudinary.uploader.destroy(existing.resume.publicId, { resource_type: "raw" }).catch(() => {});
    }
 
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $unset: { resume: 1 } },
      { new: true }
    );
    res.json({ success: true, profile });
  } catch (err) {
    // console.error("deleteResume error:", err);
    res.status(500).json({ success: false, message: "Failed to delete resume" });
  }
};