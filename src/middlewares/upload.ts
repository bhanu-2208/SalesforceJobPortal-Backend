import multer, { FileFilterCallback } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import type { Request } from "express";
import cloudinary from "../config/cloudinary";

// Same public API as the old disk-based version (uploadResume,
// uploadAvatar) — controllers and routes don't need to change how
// they call these, only how they read the result off req.file
// afterward (see profileController.ts changes: req.file.path is now
// the Cloudinary URL instead of a local path).

const resumeFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Resume must be a PDF or Word document"));
  }
  cb(null, true);
};

const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = [".png", ".jpg", ".jpeg", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Avatar must be a PNG, JPG, or WEBP image"));
  }
  cb(null, true);
};

// Resumes are non-image files, so Cloudinary needs resource_type "raw"
// (the "image"/"video" resource types are for things Cloudinary can
// transform/preview). Format is set explicitly from the original
// extension so the resulting secure_url still ends in .pdf/.docx —
// that's what lets resumeTextExtractFromUrl() below detect file type
// the same way it always has, just from a URL instead of a local path.
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
    const userId = req.user?.userId ?? "anon";
    return {
      folder: "talentcloud/resumes",
      resource_type: "raw",
      public_id: `${userId}-${Date.now()}`,
      format: ext,
    } as any; // multer-storage-cloudinary's params typing lags behind Cloudinary's own — safe to widen here
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const userId = req.user?.userId ?? "anon";
    return {
      folder: "talentcloud/avatars",
      resource_type: "image",
      public_id: `${userId}-${Date.now()}`,
      // Downsize on upload — nobody needs a multi-MB source photo for
      // a 96px navbar avatar. Cuts storage AND bandwidth against your
      // Cloudinary free-tier quota.
      transformation: [{ width: 400, height: 400, crop: "limit" }],
    } as any;
  },
});

export const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});