const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);

module.exports = router;
