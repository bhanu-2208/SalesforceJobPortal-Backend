// middlewares/auth.middleware.ts
// Attach this to any route that needs a logged-in user.


 
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AuthPayload } from "../services/auth.service";



// Extend Express Request so downstream handlers can read req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}


/**
 * requireAuth
 * Reads the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 *
 * Usage:
 *   router.get("/saved-jobs", requireAuth, savedJobsController.getAll);
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided. Please log in." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user      = decoded;
    next();
  } catch (err: unknown) {
    const isExpired = (err as Error).name === "TokenExpiredError";
    res.status(401).json({
      success: false,
      message: isExpired
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in.",
    });
  }
}

/**
 * requireAdmin
 * Run after requireAuth — rejects non-admin users.
 *
 * Usage:
 *   router.post("/jobs", requireAuth, requireAdmin, jobsController.create);
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if ((req as any).user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required." });
    return;
  }
  next();
}

export function requireRecruiterOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "recruiter" && req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Only recruiters and admins can post jobs" });
    return;
  }
  next();
}