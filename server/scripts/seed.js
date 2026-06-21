// ─── scripts/seed.js ─────────────────────────────────────────────────────────
// Demo data seeder — creates one demo user with 7 habits and 90 days of logs.
//
// Usage:  node scripts/seed.js
//         npm run seed
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");

const DEMO_EMAIL = "demo@habittracker.io";
const DEMO_PASSWORD = "demo1234";

const HABITS_DATA = [
  {
    name: "Drink 2L of water",
    description: "Stay hydrated throughout the day.",
    category: "Health",
    color: "#0ea5e9",
    icon: "💧",
    frequency: "daily",
    targetDays: 7,
    order: 0,
    streakProb: 0.95,
  },
  {
    name: "Morning run",
    description: "30-minute run before breakfast.",
    category: "Fitness",
    color: "#ef4444",
    icon: "🏃",
    frequency: "daily",
    targetDays: 5,
    order: 1,
    streakProb: 0.7,
    pattern: "weekdays",
    brokeAt: 20,
  },
  {
    name: "Read 20 minutes",
    description: "Fiction or non-fiction, no phone.",
    category: "Learning",
    color: "#6366f1",
    icon: "📚",
    frequency: "daily",
    targetDays: 7,
    order: 2,
    streakProb: 0.82,
  },
  {
    name: "Meditate",
    description: "10 minutes of breath-focused meditation.",
    category: "Mindfulness",
    color: "#8b5cf6",
    icon: "🧘",
    frequency: "daily",
    targetDays: 7,
    order: 3,
    streakProb: 0.6,
  },
  {
    name: "Journal",
    description: "Write 3 things I'm grateful for.",
    category: "Mindfulness",
    color: "#ec4899",
    icon: "✍️",
    frequency: "daily",
    targetDays: 5,
    order: 4,
    streakProb: 0.75,
    pattern: "dropoff",
  },
  {
    name: "Strength training",
    description: "Push/pull/legs split.",
    category: "Fitness",
    color: "#f59e0b",
    icon: "💪",
    frequency: "weekly",
    targetDays: 3,
    order: 5,
    streakProb: 0.55,
    pattern: "weekdays",
  },
  {
    name: "Side project — 1hr",
    description: "Ship something small every day.",
    category: "Productivity",
    color: "#14b8a6",
    icon: "🎯",
    frequency: "daily",
    targetDays: 6,
    order: 6,
    streakProb: 0.78,
  },
];

const formatDate = (d) => d.toISOString().slice(0, 10);

const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const buildLogs = (habits, userId) => {
  const logs = [];
  const today = new Date();

  for (const h of habits) {
    for (let i = 0; i < 90; i++) {
      const d = addDays(today, -i);
      const dow = d.getDay();
      const key = formatDate(d);

      let p = h.streakProb;
      if (h.pattern === "weekdays" && (dow === 0 || dow === 6)) p *= 0.35;
      if (h.pattern === "dropoff" && i < 14) p *= 0.25;
      if (h.brokeAt && i >= h.brokeAt - 2 && i <= h.brokeAt + 2) continue;

      const seed = i * 9301 + h.name.length * 49297;
      const rnd = seededRandom(seed);
      if (rnd < p) {
        logs.push({
          userId,
          habitId: h._id,
          completedDate: key,
        });
      }
    }

    // Ensure today is marked for first 4 habits
    if (habits.indexOf(h) < 4) {
      logs.push({
        userId,
        habitId: h._id,
        completedDate: formatDate(today),
      });
    }
  }

  return logs;
};

const seedDemoData = async ({ reset = false } = {}) => {
  const existing = await User.findOne({ email: DEMO_EMAIL });

  if (existing && !reset) {
    const habitCount = await Habit.countDocuments({ userId: existing._id });
    if (habitCount > 0) {
      return { created: false, email: DEMO_EMAIL, password: DEMO_PASSWORD };
    }
    reset = true;
  }

  if (existing) {
    await HabitLog.deleteMany({ userId: existing._id });
    await Habit.deleteMany({ userId: existing._id });
    if (reset) await User.deleteOne({ _id: existing._id });
  }

  const user =
    existing && !reset
      ? existing
      : await User.create({
          name: "Alex Rivera",
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          authProvider: "local",
          emailVerified: true,
          morningMotivation: true,
        });

  const habitDocs = await Habit.insertMany(
    HABITS_DATA.map(({ streakProb, pattern, brokeAt, ...h }) => ({
      ...h,
      userId: user._id,
    }))
  );

  const rawLogs = buildLogs(habitDocs, user._id);
  const seen = new Set();
  const uniqueLogs = rawLogs.filter((l) => {
    const key = `${l.habitId}_${l.completedDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await HabitLog.insertMany(uniqueLogs);

  return {
    created: true,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    habits: habitDocs.length,
    logs: uniqueLogs.length,
  };
};

const runCli = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const result = await seedDemoData({ reset: true });
  console.log(`✅ Created user: ${result.email} (password: ${result.password})`);
  console.log(`✅ Created ${result.habits} habits`);
  console.log(`✅ Inserted ${result.logs} habit logs`);
  console.log("\n🎉 Seed complete!");
  console.log(`   Email:    ${result.email}`);
  console.log(`   Password: ${result.password}\n`);

  await mongoose.disconnect();
};

module.exports = { seedDemoData, DEMO_EMAIL, DEMO_PASSWORD };

if (require.main === module) {
  runCli().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
}
