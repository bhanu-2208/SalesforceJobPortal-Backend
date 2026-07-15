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
import { startJobScheduler } from "./scheduler";
import scraperRouter from "./src/routes/scraper.routes";
import candidatesRoutes from "./src/routes/Candidates.routes";
import savedCandidatesRoutes from "./src/routes/Savedcandidates.routes";



const app  = express();
const PORT = process.env.PORT || 4000;

// ── Connect to MongoDB ───────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅  MongoDB connected");
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
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/saved-jobs", savedJobsRouter);
app.use("/api/companies",  companyRouter);
app.use("/api/feedback",   feedbackRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/applied-jobs", appliedjobs);
app.use("/api/ats", atsRoutes);
app.use("/api/scraper", scraperRouter);
app.use("/api/candidates", candidatesRoutes);
app.use("/api/saved-candidates", savedCandidatesRoutes);


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
    startJobScheduler();    
  });
});