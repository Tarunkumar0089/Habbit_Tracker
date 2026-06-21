// ─── controllers/logController.js ────────────────────────────────────────────
// HabitLog endpoints.
//
// API surface derived from axios.js mock routes:
//
//   POST   /api/logs       { habitId, date? }          → HabitLog
//   DELETE /api/logs       body: { habitId, date? }     → { message }
//   GET    /api/logs/today                              → HabitLog[]
//   GET    /api/logs/range ?start=&end=                 → HabitLog[]
//   GET    /api/logs/heatmap                            → { date, count }[]  (90 days)
//   GET    /api/logs/stats                              → { perHabit[], days[] }
//
// Log shape the frontend reads:
//   { _id, userId, habitId, completedDate }
// ─────────────────────────────────────────────────────────────────────────────
const asyncHandler = require("express-async-handler");
const HabitLog = require("../models/HabitLog");
const Habit = require("../models/Habit");
const { calcStreaks, todayKey, addDays, formatDate } = require("../utils/streakHelper");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/logs  — Mark a habit as done (idempotent: returns existing log if
//                   already marked)
// Body: { habitId, date? }   date defaults to today
// ─────────────────────────────────────────────────────────────────────────────
const markLog = asyncHandler(async (req, res) => {
  const { habitId, date } = req.body;
  if (!habitId) {
    res.status(400);
    throw new Error("habitId is required");
  }

  // Verify the habit belongs to the user
  const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
  if (!habit) {
    res.status(404);
    throw new Error("Habit not found");
  }

  const completedDate = date || todayKey();
  validateDateStr(completedDate, res);

  // Upsert — prevent duplicates (unique index guarantees this too)
  const log = await HabitLog.findOneAndUpdate(
    { userId: req.user._id, habitId, completedDate },
    { userId: req.user._id, habitId, completedDate },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(log);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/logs  — Unmark a habit
// Body: { habitId, date? }
// Frontend sends: api.delete("/logs", { data: { habitId, date } })
// ─────────────────────────────────────────────────────────────────────────────
const unmarkLog = asyncHandler(async (req, res) => {
  const { habitId, date } = req.body;
  if (!habitId) {
    res.status(400);
    throw new Error("habitId is required");
  }

  const completedDate = date || todayKey();
  validateDateStr(completedDate, res);

  await HabitLog.deleteOne({
    userId: req.user._id,
    habitId,
    completedDate,
  });

  res.json({ message: "Unmarked" });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/logs/today
// Returns all logs for the authenticated user for today.
// ─────────────────────────────────────────────────────────────────────────────
const getTodayLogs = asyncHandler(async (req, res) => {
  const logs = await HabitLog.find({
    userId: req.user._id,
    completedDate: todayKey(),
  });
  res.json(logs);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/logs/range?start=yyyy-MM-dd&end=yyyy-MM-dd
// ─────────────────────────────────────────────────────────────────────────────
const getRangeLogs = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400);
    throw new Error("start and end query params are required (yyyy-MM-dd)");
  }
  validateDateStr(start, res);
  validateDateStr(end, res);

  const logs = await HabitLog.find({
    userId: req.user._id,
    completedDate: { $gte: start, $lte: end },
  }).sort({ completedDate: 1 });

  res.json(logs);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/logs/heatmap
// Returns last 90 days of { date, count } objects for the GitHub-style heatmap.
// ─────────────────────────────────────────────────────────────────────────────
const getHeatmap = asyncHandler(async (req, res) => {
  const end = todayKey();
  const start = addDays(end, -89); // 90 days inclusive

  const logs = await HabitLog.find({
    userId: req.user._id,
    completedDate: { $gte: start, $lte: end },
  });

  // Build day-indexed count map
  const countMap = {};
  for (const log of logs) {
    countMap[log.completedDate] = (countMap[log.completedDate] || 0) + 1;
  }

  // Fill every day in the range (with 0 counts)
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = addDays(end, -i);
    days.push({ date: d, count: countMap[d] || 0 });
  }

  res.json(days);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/logs/stats
// Returns per-habit stats over the last 30 days.
//
// Response shape (matches Stats.jsx usage):
// {
//   perHabit: [{
//     habitId, name, icon, color, category,
//     completions30d, currentStreak, longestStreak
//   }],
//   days: string[]  — last 30 yyyy-MM-dd keys
// }
// ─────────────────────────────────────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const end = todayKey();
  const start = addDays(end, -29); // 30 days inclusive

  // Build 30-day key list
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(addDays(end, -i));
  }

  const [habits, logs] = await Promise.all([
    Habit.find({ userId: req.user._id, isArchived: false }),
    HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: start, $lte: end },
    }),
  ]);

  // For streak accuracy we also need history beyond 30 days
  const allLogs = await HabitLog.find({ userId: req.user._id });

  const perHabit = habits.map((h) => {
    const hid = String(h._id);

    // 30-day completions
    const month30 = logs.filter((l) => String(l.habitId) === hid);

    // All-time keys for streak calc
    const allKeys = allLogs
      .filter((l) => String(l.habitId) === hid)
      .map((l) => l.completedDate);

    const { current, longest } = calcStreaks(allKeys);

    return {
      habitId: h._id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      category: h.category,
      completions30d: month30.length,
      currentStreak: current,
      longestStreak: longest,
    };
  });

  res.json({ perHabit, days });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validate a yyyy-MM-dd string; throws 400 if malformed
// ─────────────────────────────────────────────────────────────────────────────
const validateDateStr = (dateStr, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    res.status(400);
    throw new Error(`Invalid date format "${dateStr}" — expected yyyy-MM-dd`);
  }
};

module.exports = {
  markLog,
  unmarkLog,
  getTodayLogs,
  getRangeLogs,
  getHeatmap,
  getStats,
};
