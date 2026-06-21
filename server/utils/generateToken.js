// ─── utils/generateToken.js ───────────────────────────────────────────────────
// Creates a signed JWT for a given user ID.
// ─────────────────────────────────────────────────────────────────────────────
const jwt = require("jsonwebtoken");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

module.exports = generateToken;
