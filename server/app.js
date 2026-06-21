// ─── app.js ──────────────────────────────────────────────────────────────────
// Express application: middleware pipeline, route mounting, global error handler.
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const habitRoutes = require("./routes/habitRoutes");
const logRoutes = require("./routes/logRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

// ── Body parsing & logging ─────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── API Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

// ── 404 & global error handler ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
