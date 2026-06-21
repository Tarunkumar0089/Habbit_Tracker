// ─── routes/habitRoutes.js ────────────────────────────────────────────────────
// IMPORTANT: /reorder must be defined BEFORE /:id so it isn't swallowed
// by the parameterised route.
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const {
  getHabits,
  createHabit,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleArchive,
  reorderHabits,
} = require("../controllers/habitController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // all habit routes require auth

router.route("/").get(getHabits).post(createHabit);

// Static sub-routes BEFORE dynamic :id
router.patch("/reorder", reorderHabits);

router.route("/:id").get(getHabitById).put(updateHabit).delete(deleteHabit);

// Archive toggle — frontend uses PUT /habits/:id/archive
router.put("/:id/archive", toggleArchive);

module.exports = router;
