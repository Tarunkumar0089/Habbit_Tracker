// ─── server.js ──────────────────────────────────────────────────────────────
// Entry point: loads env, connects DB, starts HTTP server.
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8000;

const { seedDemoData, DEMO_EMAIL, DEMO_PASSWORD } = require("./scripts/seed");

connectDB().then(async () => {
  if (process.env.NODE_ENV === "development") {
    try {
      const result = await seedDemoData();
      if (result.created) {
        console.log(
          `🌱  Demo account ready — ${DEMO_EMAIL} / ${DEMO_PASSWORD}`
        );
      }
    } catch (err) {
      console.warn("⚠️  Demo seed skipped:", err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(
      `\n🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}\n`
    );
  });
});
