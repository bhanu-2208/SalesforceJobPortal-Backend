// services/feedback.service.ts
import Feedback from "../models/Feedback";

export interface CreateFeedbackInput {
  userId:   string;
  name:     string;
  email:    string;
  role?:    string;
  category?: string;
  rating:   number;
  message:  string;
}

// ── Create feedback ────────────────────────────────────────────────────
export async function createFeedback(input: CreateFeedbackInput) {
  if (input.rating < 1 || input.rating > 5) {
    throw Object.assign(new Error("Rating must be between 1 and 5."), { status: 400 });
  }
  if (!input.message || input.message.trim().length < 20) {
    throw Object.assign(new Error("Message must be at least 20 characters."), { status: 400 });
  }

  return Feedback.create({
    user:     input.userId,
    name:     input.name.trim(),
    email:    input.email.toLowerCase().trim(),
    role:     input.role,
    category: (input.category || "General Feedback") as any,    rating:   input.rating,
    message:  input.message.trim(),
  });
}

// ── Get all feedback (admin only) ──────────────────────────────────────
export async function getAllFeedback(filters: { status?: string; page?: number; limit?: number }) {
  const page  = Math.max(1, filters.page  ?? 1);
  const limit = Math.min(50, filters.limit ?? 20);
  const skip  = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (filters.status) query.status = filters.status;

  const [total, data] = await Promise.all([
    Feedback.countDocuments(query),
    Feedback.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

// ── Get feedback submitted by a specific user ──────────────────────────
export async function getMyFeedback(userId: string) {
  return Feedback.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

// ── Update feedback status (admin only) ─────────────────────────────────
export async function updateFeedbackStatus(id: string, status: string) {
  const validStatuses = ["new", "reviewed", "resolved"];
  if (!validStatuses.includes(status)) {
    throw Object.assign(new Error("Invalid status value."), { status: 400 });
  }
  const updated = await Feedback.findByIdAndUpdate(id, { status }, { new: true });
  if (!updated) throw Object.assign(new Error("Feedback not found."), { status: 404 });
  return updated;
}

// ── Delete feedback (admin only) ────────────────────────────────────────
export async function deleteFeedback(id: string) {
  const deleted = await Feedback.findByIdAndDelete(id);
  if (!deleted) throw Object.assign(new Error("Feedback not found."), { status: 404 });
  return deleted;
}