import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// If you already have an auth middleware in your project (you likely do,
// since /api/auth/logout exists in your navbar code), DELETE this file
// and just point profileRoutes.ts at your existing one instead.
//
// This version expects either:
//   - an httpOnly cookie called "tc_token", or
//   - an "Authorization: Bearer <token>" header
// and verifies it with JWT_SECRET from your .env.

interface DecodedToken extends JwtPayload {
  id?: string;
  _id?: string;
  userId?: string;
  email?: string;
  role?: string;
}

export default function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  const token = req.cookies?.tc_token || bearer;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    // Use your project's existing Request.user type
    (req as any).user = {
      userId: decoded.id || decoded.userId || decoded._id || "",
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (err) {
    // console.error("JWT Verify Error:", err);

    res.status(401).json({
      success: false,
      message: err instanceof Error ? err.message : "Authentication failed",
    });
  }
}

