// models/Feedback.ts
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    role: {
      type: String, // Salesforce role of the person giving feedback (optional)
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "General Feedback",
        "Job Listing Quality",
        "Search & Filters",
        "Website Experience",
        "Success Story",
        "Bug Report",
        "Feature Request",
      ],
      default: "General Feedback",
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },

    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

// Fast lookup: "show me all feedback from this user"
feedbackSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);