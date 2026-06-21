const asyncHandler = require("express-async-handler");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const {
  generateWeeklyReport,
  generateHabitSuggestions,
  generateRecoveryPlan,
  generateMorningMotivation,
  generateChatResponse,
  isRetryableGeminiError,
} = require("../services/geminiService");
const {
  generateLocalWeeklyReport,
  generateLocalMorningMotivation,
  generateLocalRecoveryPlan,
} = require("../utils/localAiFallback");
const { calcStreaks, todayKey, addDays } = require("../utils/streakHelper");

const withAiFallback = async (aiFn, localFn) => {
  try {
    const content = await aiFn();
    return { content, source: "ai" };
  } catch (err) {
    if (!isRetryableGeminiError(err)) throw err;
    return { content: localFn(), source: "local" };
  }
};

const weeklyReport = asyncHandler(async (req, res) => {
  const end = todayKey();
  const start = addDays(end, -6);

  const [habits, logs] = await Promise.all([
    Habit.find({ userId: req.user._id, isArchived: false }),
    HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: start, $lte: end },
    }),
  ]);

  const userName = req.user.name.split(" ")[0];
  const payload = { userName, habits, logs };

  const result = await withAiFallback(
    () => generateWeeklyReport(payload),
    () => generateLocalWeeklyReport(payload)
  );

  res.json(result);
});

const suggestHabits = asyncHandler(async (req, res) => {
  const { goals, productiveTime, struggles } = req.body;

  if (!goals || !productiveTime || !struggles) {
    res.status(400);
    throw new Error("goals, productiveTime and struggles are all required");
  }

  try {
    const suggestions = await generateHabitSuggestions({
      goals,
      productiveTime,
      struggles,
    });
    res.json({ suggestions, source: "ai" });
  } catch (err) {
    if (!isRetryableGeminiError(err)) throw err;
    res.json({
      source: "local",
      suggestions: [
        {
          name: "10-minute morning walk",
          description: "A short walk to start the day with energy.",
          category: "Fitness",
          frequency: "daily",
          icon: "🚶",
          reason: `Fits your goal: ${goals.slice(0, 80)}`,
        },
        {
          name: "Read 15 pages",
          description: `Small daily reading block during ${productiveTime}.`,
          category: "Learning",
          frequency: "daily",
          icon: "📖",
          reason: "Easy to stack onto an existing routine.",
        },
        {
          name: "Evening reflection",
          description: "Write 3 lines about what went well today.",
          category: "Mindfulness",
          frequency: "daily",
          icon: "✍️",
          reason: `Helps with: ${struggles.slice(0, 80)}`,
        },
      ],
    });
  }
});

const recoveryPlan = asyncHandler(async (req, res) => {
  const { habitId } = req.body;
  if (!habitId) {
    res.status(400);
    throw new Error("habitId is required");
  }

  const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
  if (!habit) {
    res.status(404);
    throw new Error("Habit not found");
  }

  const logs = await HabitLog.find({
    userId: req.user._id,
    habitId: habit._id,
  });
  const keys = logs.map((l) => l.completedDate);
  const { longest } = calcStreaks(keys);

  const lastLog = logs.map((l) => l.completedDate).sort().pop();
  const daysBroken = lastLog
    ? Math.round((new Date(todayKey()) - new Date(lastLog)) / 86400000)
    : 0;

  const payload = { habit, longestStreak: longest, daysBroken };
  const result = await withAiFallback(
    () => generateRecoveryPlan(payload),
    () => generateLocalRecoveryPlan({ habit, longestStreak: longest })
  );

  res.json(result);
});

const chat = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    res.status(400);
    throw new Error("question is required");
  }

  const end = todayKey();
  const start = addDays(end, -29);

  const [habits, logs30] = await Promise.all([
    Habit.find({ userId: req.user._id }),
    HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: start, $lte: end },
    }),
  ]);

  const userName = req.user.name.split(" ")[0];

  try {
    const content = await generateChatResponse({
      question: question.trim(),
      userName,
      habits,
      logs30,
    });
    res.json({ content, source: "ai" });
  } catch (err) {
    if (!isRetryableGeminiError(err)) throw err;
    const top = habits
      .map((h) => ({
        h,
        n: logs30.filter((l) => String(l.habitId) === String(h._id)).length,
      }))
      .sort((a, b) => b.n - a.n)[0];
    res.json({
      source: "local",
      content: top
        ? `Based on your last 30 days, **${top.h.name}** leads with **${top.n} completions**. Regarding "${question.trim()}" — focus on keeping that habit consistent; it's your strongest signal right now. *Connect Gemini API for deeper personalised answers.*`
        : `I don't have enough habit data yet to answer "${question.trim()}" in detail. Log a few more days first, or connect your Gemini API key for full AI chat.`,
    });
  }
});

const morningMotivation = asyncHandler(async (req, res) => {
  const end = todayKey();
  const start = addDays(end, -89);

  const [habits, allLogs] = await Promise.all([
    Habit.find({ userId: req.user._id, isArchived: false }),
    HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: start, $lte: end },
    }),
  ]);

  const streaks = habits.map((h) => {
    const keys = allLogs
      .filter((l) => String(l.habitId) === String(h._id))
      .map((l) => l.completedDate);
    const { current } = calcStreaks(keys);
    return { name: h.name, icon: h.icon, current };
  });

  const userName = req.user.name.split(" ")[0];
  const result = await withAiFallback(
    () => generateMorningMotivation({ userName, habits, streaks }),
    () => generateLocalMorningMotivation({ userName, streaks })
  );

  res.json(result);
});

module.exports = { weeklyReport, suggestHabits, recoveryPlan, chat, morningMotivation };
