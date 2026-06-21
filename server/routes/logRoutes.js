// ─── routes/logRoutes.js ──────────────────────────────────────────────────────
// Log mark / unmark share the same path (/api/logs) with POST and DELETE.
// Static sub-paths (today, range, heatmap, stats) are defined before any
// dynamic routes to avoid conflicts.
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const {
  markLog,
  unmarkLog,
  getTodayLogs,
  getRangeLogs,
  getHeatmap,
  getStats,
} = require("../controllers/logController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // all log routes require auth

// POST  /api/logs        → mark habit done
// DELETE /api/logs       → unmark habit (body: { habitId, date })
router.route("/").post(markLog).delete(unmarkLog);

// Static sub-routes
router.get("/today", getTodayLogs);
router.get("/range", getRangeLogs);
router.get("/heatmap", getHeatmap);
router.get("/stats", getStats);

module.exports = router;
