import bcrypt from "bcryptjs";
import jwt    from "jsonwebtoken";
import User ,{IUser}  from "../models/User";
import { sendOtpEmail, sendWelcomeEmail } from "./email.service";

// ── Types ────────────────────────────────────────────────────────────
export interface RegisterInput {
  name:     string;
  email:    string;
  password: string;
  role?: "user" | "admin" | "recruiter";}

export interface LoginInput {
  email:    string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email:  string;
  role:   string;
}

export interface AuthResult {
  token:        string;
  refreshToken: string;
  user: {
    id:    string;
    name:  string;
    email: string;
    role:  string;
  };
}

// ── Config ───────────────────────────────────────────────────────────
const JWT_SECRET         = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     ?? "15m";
const REFRESH_SECRET     = process.env.REFRESH_SECRET!;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN ?? "7d";
const SALT_ROUNDS        = 12;
const OTP_EXPIRY_MINUTES = 10;

// ── Token helpers ────────────────────────────────────────────────────
export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}
export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
}
export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}
export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, REFRESH_SECRET) as AuthPayload;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// ── Register — creates unverified user, sends OTP ──────────────────
export async function register(input: RegisterInput): Promise<{ email: string; message: string }> {
  const { name, email, password, role } = input;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.isVerified) {
      throw Object.assign(new Error("Email already in use."), { status: 409 });
    }
    // Existing but unverified — allow re-registering by refreshing OTP
    await User.deleteOne({ _id: existing._id });
  }

  if (password.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters."), { status: 400 });
  }

  const hashed   = await bcrypt.hash(password, SALT_ROUNDS);
  const safeRole = ["admin", "recruiter"].includes(role || "") ? role : "user";
  const otp      = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const user = await User.create({
    name:       name.trim(),
    email:      email.toLowerCase().trim(),
    password:   hashed,
    role:       safeRole,
    isVerified: false,
    otp,
    otpExpiry,
  }) as IUser;
  if (!user) {
      throw new Error("Failed to create user");
  }

  await sendOtpEmail(user.email, user.name, otp);

  return {
    email:   user.email,
    message: "Verification code sent to your email.",
  };
}

// ── Verify OTP — completes registration, issues tokens ──────────────
export async function verifyOtp(email: string, otp: string): Promise<AuthResult> {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+otp +otpExpiry");
  if (!user) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }
  if (user.isVerified) {
    throw Object.assign(new Error("Account already verified. Please log in."), { status: 400 });
  }
  if (!user.otp || user.otp !== otp) {
    throw Object.assign(new Error("Invalid verification code."), { status: 400 });
  }
  if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
    throw Object.assign(new Error("Verification code expired. Please request a new one."), { status: 400 });
  }

  user.isVerified = true;
  user.otp        = undefined;
  user.otpExpiry  = undefined;
  await user.save();

  await sendWelcomeEmail(user.email, user.name);

  const payload: AuthPayload = { userId: user._id.toString(), email: user.email, role: user.role };
  return {
    token:        signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  };
}

// ── Resend OTP ───────────────────────────────────────────────────────
export async function resendOtp(email: string): Promise<{ message: string }> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }
  if (user.isVerified) {
    throw Object.assign(new Error("Account already verified. Please log in."), { status: 400 });
  }

  const otp = generateOtp();
  user.otp       = otp;
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  await sendOtpEmail(user.email, user.name, otp);
  return { message: "A new verification code has been sent." };
}

// ── Login ────────────────────────────────────────────────────────────
export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  if (!user.isVerified) {
    throw Object.assign(
      new Error("Please verify your email before logging in."),
      { status: 403, email: user.email } as any
    );
  }

  const payload: AuthPayload = { userId: user._id.toString(), email: user.email, role: user.role };
  return {
    token:        signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  };
}

// ── Refresh ───────────────────────────────────────────────────────────
export async function refresh(refreshToken: string): Promise<{ token: string }> {
  const payload = verifyRefreshToken(refreshToken);
  const user    = await User.findById(payload.userId);
  if (!user) throw Object.assign(new Error("User not found."), { status: 401 });

  return { token: signAccessToken({ userId: user._id.toString(), email: user.email, role: user.role }) };
}

// ── Get me ────────────────────────────────────────────────────────────
export async function getMe(userId: string) {
  const user = await User.findById(userId).select("-password");
  if (!user) throw Object.assign(new Error("User not found."), { status: 404 });
  return user;
}