// ─── models/Habit.js ─────────────────────────────────────────────────────────
// Habit schema.
//
// Frontend field reference (from HabitForm.jsx and mock data):
//   _id, userId, name, description, category, frequency, targetDays,
//   color, icon, isArchived, order, createdAt, updatedAt
//
// Note: the frontend uses "name" everywhere (not "title").
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Productivity",
  "Social",
  "Finance",
  "Creative",
  "Other",
];

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Core fields ──────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Habit name is required"],
      trim: true,
      maxlength: [120, "Habit name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: "{VALUE} is not a valid category" },
      default: "Other",
    },

    // ── Scheduling ───────────────────────────────────────────────────────
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    targetDays: {
      type: Number,
      min: 1,
      max: 7,
      default: 7,
    },

    // ── Visual ───────────────────────────────────────────────────────────
    color: {
      type: String,
      default: "#6366f1",
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"],
    },
    icon: {
      type: String,
      default: "🎯",
    },

    // ── State ────────────────────────────────────────────────────────────
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    // order within user's list (for drag-and-drop reordering)
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────────────────────
habitSchema.index({ userId: 1, isArchived: 1, order: 1 });
habitSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model("Habit", habitSchema);
