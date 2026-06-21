// ─── controllers/habitController.js ──────────────────────────────────────────
// All habit CRUD + archive toggle + reorder.
//
// Response shapes derived from frontend (Dashboard.jsx, Habits.jsx):
//   GET  /habits         → Array<Habit>
//   POST /habits         → Habit
//   GET  /habits/:id     → Habit
//   PUT  /habits/:id     → Habit
//   DELETE /habits/:id   → { message: "Deleted" }
//   PUT  /habits/:id/archive → Habit  (toggled isArchived)
//   PATCH /habits/reorder    → { message: "Reordered" }
// ─────────────────────────────────────────────────────────────────────────────
const asyncHandler = require("express-async-handler");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/habits
// Query: includeArchived=true|false  (default: false)
// ─────────────────────────────────────────────────────────────────────────────
const getHabits = asyncHandler(async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";

  const filter = { userId: req.user._id };
  if (!includeArchived) filter.isArchived = false;

  const habits = await Habit.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(habits);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/habits
// Body: { name, description?, category?, frequency?, targetDays?, color?, icon? }
// ─────────────────────────────────────────────────────────────────────────────
const createHabit = asyncHandler(async (req, res) => {
  const { name, description, category, frequency, targetDays, color, icon } =
    req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Habit name is required");
  }

  // Set order to end of list
  const count = await Habit.countDocuments({
    userId: req.user._id,
    isArchived: false,
  });

  const habit = await Habit.create({
    userId: req.user._id,
    name: name.trim(),
    description: description?.trim() || "",
    category: category || "Other",
    frequency: frequency || "daily",
    targetDays: Number(targetDays) || 7,
    color: color || "#6366f1",
    icon: icon || "🎯",
    order: count,
  });

  res.status(201).json(habit);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/habits/:id
// ─────────────────────────────────────────────────────────────────────────────
const getHabitById = asyncHandler(async (req, res) => {
  const habit = await findOwnHabit(req.params.id, req.user._id, res);
  res.json(habit);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/habits/:id
// Body: Partial<Habit fields>
// ─────────────────────────────────────────────────────────────────────────────
const updateHabit = asyncHandler(async (req, res) => {
  const habit = await findOwnHabit(req.params.id, req.user._id, res);

  const allowed = [
    "name",
    "description",
    "category",
    "frequency",
    "targetDays",
    "color",
    "icon",
    "order",
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) habit[key] = req.body[key];
  });

  const updated = await habit.save();
  res.json(updated);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/habits/:id
// Also cascades to delete all HabitLog entries for this habit.
// ─────────────────────────────────────────────────────────────────────────────
const deleteHabit = asyncHandler(async (req, res) => {
  const habit = await findOwnHabit(req.params.id, req.user._id, res);

  // Cascade delete logs
  await HabitLog.deleteMany({ habitId: habit._id, userId: req.user._id });
  await habit.deleteOne();

  res.json({ message: "Deleted" });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/habits/:id/archive  (toggle)
// Frontend calls api.put(`/habits/${id}/archive`) with no body.
// Returns the updated habit so the frontend can update its local state.
// ─────────────────────────────────────────────────────────────────────────────
const toggleArchive = asyncHandler(async (req, res) => {
  const habit = await findOwnHabit(req.params.id, req.user._id, res);
  habit.isArchived = !habit.isArchived;
  const updated = await habit.save();
  res.json(updated);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/habits/reorder
// Body: { order: [{ _id, order }] }
// Bulk-update the order field of multiple habits.
// ─────────────────────────────────────────────────────────────────────────────
const reorderHabits = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    res.status(400);
    throw new Error("order must be an array of { _id, order } objects");
  }

  const bulkOps = order.map(({ _id, order: newOrder }) => ({
    updateOne: {
      filter: { _id, userId: req.user._id },
      update: { $set: { order: newOrder } },
    },
  }));

  await Habit.bulkWrite(bulkOps);
  res.json({ message: "Reordered" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: find a habit belonging to the current user or 404
// ─────────────────────────────────────────────────────────────────────────────
const findOwnHabit = async (id, userId, res) => {
  const habit = await Habit.findOne({ _id: id, userId });
  if (!habit) {
    res.status(404);
    throw new Error("Habit not found");
  }
  return habit;
};

module.exports = {
  getHabits,
  createHabit,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleArchive,
  reorderHabits,
};
