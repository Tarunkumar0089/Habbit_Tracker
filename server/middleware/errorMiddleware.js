// ─── middleware/errorMiddleware.js ────────────────────────────────────────────
// Centralised error handling so every controller can simply throw or set
// res.status + throw without worrying about JSON formatting.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 404 handler — mounted AFTER all routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler — must have 4 params so Express recognises it.
 */
const errorHandler = (err, req, res, _next) => {
  // If status is still 200 (no explicit status set), default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mongoose CastError → 400 (bad ObjectId)
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ message: `Invalid ID: ${err.value}`, stack: devStack(err) });
  }

  // Mongoose duplicate key → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      message: `${field} already exists`,
      stack: devStack(err),
    });
  }

  // Mongoose validation error → 422
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res
      .status(422)
      .json({ message: messages.join(", "), stack: devStack(err) });
  }

  // Custom errors with statusCode (e.g. Gemini quota)
  if (err.statusCode && err.statusCode !== 500) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      stack: devStack(err),
    });
  }

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: devStack(err),
  });
};

const devStack = (err) =>
  process.env.NODE_ENV === "production" ? undefined : err.stack;

module.exports = { notFound, errorHandler };
