import express      from "express";
import cors         from "cors";
import dotenv       from "dotenv";
import mongoose     from "mongoose";
import cookieParser from "cookie-parser";

dotenv.config();

import authRouter from "./src/routes/auth.routes";
import jobsRouter from "./src/routes/jobs.routes";
import savedJobsRouter from "./src/routes/savedJobs.routes";
import companyRouter   from "./src/routes/companies.routes";
import feedbackRouter  from "./src/routes/Feedback.routes";
import profileRoutes from "./src/routes/profile.routes";
import appliedjobs from "./src/routes/Appliedjobs.routes"
import atsRoutes from "./src//routes/Ats.routes";
import scraperRouter from "./src/routes/scraper.routes";
import candidatesRoutes from "./src/routes/Candidates.routes";
import savedCandidatesRoutes from "./src/routes/Savedcandidates.routes";
import {
 seedATSCompanies
} from "./src/services/companyRegistry.service";
import rateLimit from "express-rate-limit";


const app  = express();

app.set("trust proxy", 1);
console.log("Trust proxy value:", app.get("trust proxy"));


// Strict — login/register are high-abuse targets (brute force, spam accounts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later." },
  validate: {
    xForwardedForHeader: false,
  }
});

// Moderate — general API browsing (jobs, companies, saved jobs) needs headroom
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // generous — covers normal search/filter/pagination behavior
});

// Very strict — AI generation costs real quota (Gemini) and is expensive per call
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // 10 AI generations per hour per IP
  message: { success: false, message: "AI generation limit reached. Try again in an hour." },
});

// Admin-only manual scraper trigger — rarely called, keep it tight
const scraperLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const PORT = process.env.PORT || 4000;

// ── Connect to MongoDB ───────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅  MongoDB connected");
    await seedATSCompanies();
  } catch (err: any) {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────
// app.use("/api/auth", authRouter);
// app.use("/api/jobs", jobsRouter);
// app.use("/api/saved-jobs", savedJobsRouter);
// app.use("/api/companies",  companyRouter);
// app.use("/api/feedback",   feedbackRouter);
// app.use("/api/profile", profileRoutes);
// app.use("/api/applied-jobs", appliedjobs);
// app.use("/api/ats", atsRoutes);
// app.use("/api/scraper", scraperRouter);
// app.use("/api/candidates", candidatesRoutes);
// app.use("/api/saved-candidates", savedCandidatesRoutes);


app.use("/api/auth",            authLimiter,    authRouter);
app.use("/api/jobs",             generalLimiter, jobsRouter);
app.use("/api/saved-jobs",       generalLimiter, savedJobsRouter);
app.use("/api/companies",        generalLimiter, companyRouter);
app.use("/api/feedback",         generalLimiter, feedbackRouter);
app.use("/api/profile",          generalLimiter, profileRoutes);
app.use("/api/applied-jobs",     generalLimiter, appliedjobs);
app.use("/api/candidates",       generalLimiter, candidatesRoutes);
app.use("/api/saved-candidates", generalLimiter, savedCandidatesRoutes);
app.use("/api/ats",              generalLimiter, atsRoutes);
app.use("/api/scraper",          scraperLimiter, scraperRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ── Boot ─────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅  Server running on http://localhost:${PORT}`);
  });
});