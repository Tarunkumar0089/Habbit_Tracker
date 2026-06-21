const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const generateToken = require("../utils/generateToken");
const { generateOtp, hashOtp, matchOtp, otpExpiresAt } = require("../utils/otpHelper");
const { sendOtpEmail } = require("../services/emailService");
const { verifyGoogleToken } = require("../services/googleAuthService");

const authResponse = (user, res, status = 200) => {
  const token = generateToken(user._id);
  if (status !== 200) {
    return res.status(status).json({ user: user.toPublicJSON(), token });
  }
  res.json({ user: user.toPublicJSON(), token });
};

// POST /api/auth/send-otp — start signup with email verification
const sendOtp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email || !password) {
    res.status(400);
    throw new Error("name, email and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await OtpVerification.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      name: name.trim(),
      password,
      otpHash,
      expiresAt: otpExpiresAt(),
      attempts: 0,
    },
    { upsert: true, new: true }
  );

  const { devOtp } = await sendOtpEmail({
    email: normalizedEmail,
    otp,
    name: name.trim(),
  });

  res.json({
    message: "Verification code sent to your email",
    ...(devOtp && { devOtp }),
  });
});

// POST /api/auth/verify-otp — complete signup
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error("email and otp are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const pending = await OtpVerification.findOne({ email: normalizedEmail });

  if (!pending) {
    res.status(400);
    throw new Error("No pending signup found. Please request a new code.");
  }

  if (pending.expiresAt < new Date()) {
    await pending.deleteOne();
    res.status(400);
    throw new Error("Verification code expired. Please request a new one.");
  }

  if (pending.attempts >= 5) {
    await pending.deleteOne();
    res.status(429);
    throw new Error("Too many failed attempts. Please request a new code.");
  }

  const valid = await matchOtp(String(otp).trim(), pending.otpHash);
  if (!valid) {
    pending.attempts += 1;
    await pending.save();
    res.status(400);
    throw new Error("Invalid verification code");
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    await pending.deleteOne();
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name: pending.name,
    email: normalizedEmail,
    password: pending.password,
    authProvider: "local",
    emailVerified: true,
  });

  await pending.deleteOne();
  authResponse(user, res, 201);
});

// POST /api/auth/register — kept for backward compatibility (direct register)
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("name, email and password are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    authProvider: "local",
    emailVerified: false,
  });

  authResponse(user, res, 201);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.authProvider === "google" && !user.password) {
    res.status(400);
    throw new Error("This account uses Google sign-in. Please continue with Google.");
  }

  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  authResponse(user, res);
});

// POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required");
  }

  const profile = await verifyGoogleToken(credential);
  let user = await User.findOne({
    $or: [{ googleId: profile.googleId }, { email: profile.email }],
  }).select("+password");

  if (user) {
    if (!user.googleId) {
      user.googleId = profile.googleId;
      user.authProvider = user.password ? "local" : "google";
    }
    if (profile.emailVerified) user.emailVerified = true;
    if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
    await user.save();
  } else {
    user = await User.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      authProvider: "google",
      emailVerified: profile.emailVerified,
      avatar: profile.avatar || profile.name.charAt(0).toUpperCase(),
    });
  }

  authResponse(user, res);
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    name,
    morningMotivation,
    emailNotifications,
    weeklyReportEmail,
    streakReminders,
    compactView,
    timezone,
  } = req.body;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      res.status(400);
      throw new Error("name cannot be empty");
    }
    user.name = name.trim();
    if (!user.googleId || !user.avatar?.startsWith("http")) {
      user.avatar = name.trim().charAt(0).toUpperCase();
    }
  }

  if (morningMotivation !== undefined) {
    user.morningMotivation = Boolean(morningMotivation);
  }
  if (emailNotifications !== undefined) {
    user.emailNotifications = Boolean(emailNotifications);
  }
  if (weeklyReportEmail !== undefined) {
    user.weeklyReportEmail = Boolean(weeklyReportEmail);
  }
  if (streakReminders !== undefined) {
    user.streakReminders = Boolean(streakReminders);
  }
  if (compactView !== undefined) {
    user.compactView = Boolean(compactView);
  }
  if (timezone !== undefined) {
    if (typeof timezone !== "string" || !timezone.trim()) {
      res.status(400);
      throw new Error("timezone cannot be empty");
    }
    user.timezone = timezone.trim();
  }

  const updated = await user.save();
  res.json({ user: updated.toPublicJSON() });
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  if (user.authProvider === "google" && !user.password) {
    user.password = newPassword;
    user.authProvider = "google";
  } else {
    if (!currentPassword) {
      res.status(400);
      throw new Error("Current password is required");
    }
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }
    user.password = newPassword;
  }

  await user.save();
  res.json({ message: "Password updated successfully" });
});

// DELETE /api/auth/account
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const { password } = req.body;

  if (user.password) {
    if (!password) {
      res.status(400);
      throw new Error("Password is required to delete your account");
    }
    if (!(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Incorrect password");
    }
  }

  await HabitLog.deleteMany({ userId: user._id });
  await Habit.deleteMany({ userId: user._id });
  await user.deleteOne();

  res.json({ message: "Account deleted successfully" });
});

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};
