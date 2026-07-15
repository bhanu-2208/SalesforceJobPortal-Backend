import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

// Local disk storage. Swap this out for S3 / Cloudinary later —
// only this file needs to change, controllers stay the same
// because they just read `req.file.path` / `req.file.filename`.

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
const RESUME_DIR = path.join(UPLOAD_ROOT, "resumes");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");

[UPLOAD_ROOT, RESUME_DIR, AVATAR_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function makeStorage(dir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (req: Request, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeUserId = req.user?.userId ?? "anon";
      cb(null, `${safeUserId}-${Date.now()}${ext}`);
    },
  });
}

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

export const uploadResume = multer({
  storage: makeStorage(RESUME_DIR),
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadAvatar = multer({
  storage: makeStorage(AVATAR_DIR),
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export { RESUME_DIR, AVATAR_DIR };