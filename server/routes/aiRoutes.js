// ─── routes/aiRoutes.js ───────────────────────────────────────────────────────
// All routes derived from mock axios.js:
//   POST /ai/weekly-report
//   POST /ai/suggest-habits
//   POST /ai/recovery-plan
//   POST /ai/chat
//   GET  /ai/morning
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const {
  weeklyReport,
  suggestHabits,
  recoveryPlan,
  chat,
  morningMotivation,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // all AI routes require auth

router.post("/weekly-report", weeklyReport);
router.post("/suggest-habits", suggestHabits);
router.post("/recovery-plan", recoveryPlan);
router.post("/chat", chat);
router.get("/morning", morningMotivation);

module.exports = router;
