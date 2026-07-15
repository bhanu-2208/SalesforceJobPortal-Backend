// routes/auth.routes.ts

import { Router } from "express";
import { register, login, refresh, logout, getMe,resendOtp, verifyOtp } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", register);

authRouter.post("/verify-otp",  verifyOtp);
authRouter.post("/resend-otp",  resendOtp);

// POST /api/auth/login
authRouter.post("/login", login);

// POST /api/auth/refresh  — uses httpOnly cookie
authRouter.post("/refresh", refresh);

// POST /api/auth/logout
authRouter.post("/logout", logout);

// GET  /api/auth/me  — protected
authRouter.get("/me", requireAuth, getMe);

export default authRouter;