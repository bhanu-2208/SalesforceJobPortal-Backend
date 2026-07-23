// controllers/auth.controller.ts
import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";

// POST /api/auth/register — sends OTP, does NOT log in yet
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: "Invalid email format." });
      return;
    }

    const result = await AuthService.register({ name, email, password, role });
    res.status(201).json({ success: true, ...result });
    return;
  } catch (err: any) {
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Registration failed." });
    return;
  }
}

// POST /api/auth/verify-otp — completes registration, issues tokens
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and code are required." });
      return;
    }

    const result = await AuthService.verifyOtp(email, otp);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
      , maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token:   result.token,
      user:    result.user,
    });
    return;
  } catch (err: any) {
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Verification failed." });
    return;
  }
}

// POST /api/auth/resend-otp
export async function resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required." });
      return;
    }
    const result = await AuthService.resendOtp(email);
    res.status(200).json({ success: true, ...result });
    return;
  } catch (err: any) {
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Failed to resend code." });
    return;
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required." });
      return;
    }

    const result = await AuthService.login({ email, password });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token:   result.token,
      user:    result.user,
    });
    return;
  } catch (err: any) {
    // Special case — unverified email — tell frontend to redirect to OTP screen
    if (err.status === 403 && err.email) {
      res.status(403).json({ success: false, message: err.message, needsVerification: true, email: err.email });
      return;
    }
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Login failed." });
    return;
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: "No refresh token." });
      return;
    }
    const result = await AuthService.refresh(refreshToken);
    res.status(200).json({ success: true, token: result.token });
    return;
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
    return;
  }
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "none" : "strict" });
  res.status(200).json({ success: true, message: "Logged out." });
  return;
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }
    const user = await AuthService.getMe(userId);
    res.status(200).json({ success: true, data: user });
    return;
  } catch (err: any) {
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Failed to fetch user." });
    return;
  }
}