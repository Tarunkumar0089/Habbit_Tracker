// ─── middleware/authMiddleware.js ─────────────────────────────────────────────
// Validates the JWT from the Authorization header and attaches req.user.
// ─────────────────────────────────────────────────────────────────────────────
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorised — no token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Not authorised — token is invalid or expired");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("Not authorised — user no longer exists");
  }

  req.user = user;
  next();
});

module.exports = { protect };
