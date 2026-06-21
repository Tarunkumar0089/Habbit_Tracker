// ─── models/HabitLog.js ──────────────────────────────────────────────────────
// One document per (user, habit, date) triple.
//
// Frontend field reference (from mock data and axios.js):
//   _id, userId, habitId, completedDate   ← frontend reads "completedDate"
//
// The unique compound index prevents double-logging the same habit on the
// same date for the same user.
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    // Date stored as "yyyy-MM-dd" string for easy range queries and heatmap
    completedDate: {
      type: String,
      required: [true, "completedDate is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "completedDate must be yyyy-MM-dd"],
      index: true,
    },
    // Optional free-text notes for the day
    notes: {
      type: String,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

// ── Unique constraint: one log per habit per day per user ─────────────────
habitLogSchema.index(
  { userId: 1, habitId: 1, completedDate: 1 },
  { unique: true }
);

// ── Efficient range queries (heatmap, stats) ──────────────────────────────
habitLogSchema.index({ userId: 1, completedDate: 1 });

module.exports = mongoose.model("HabitLog", habitLogSchema);
