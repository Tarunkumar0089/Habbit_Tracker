// ─── utils/streakHelper.js ────────────────────────────────────────────────────
// Pure-function streak calculation that mirrors the frontend logic in
// dateHelpers.js → streakFromKeys().
//
// Input: array of "yyyy-MM-dd" strings (any order).
// Output: { current, longest }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns { current, longest } streak counts.
 * @param {string[]} dateKeys  – "yyyy-MM-dd" strings
 * @returns {{ current: number, longest: number }}
 */
const calcStreaks = (dateKeys) => {
  if (!dateKeys || dateKeys.length === 0) return { current: 0, longest: 0 };

  const set = new Set(dateKeys);
  const today = todayKey();
  const yesterday = addDays(today, -1);

  // ── Current streak ────────────────────────────────────────────────────
  let current = 0;
  let cursor =
    set.has(today) ? today : set.has(yesterday) ? yesterday : null;

  if (cursor) {
    while (set.has(cursor)) {
      current++;
      cursor = addDays(cursor, -1);
    }
  }

  // ── Longest streak ────────────────────────────────────────────────────
  const sorted = [...dateKeys].sort(); // ascending
  let longest = 0;
  let run = 0;
  let prev = null;

  for (const k of sorted) {
    if (prev) {
      const diff = dayDiff(prev, k);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = k;
  }

  return { current, longest };
};

// ── Date helpers ──────────────────────────────────────────────────────────

/** "yyyy-MM-dd" for today (UTC-aware: uses server local date) */
const todayKey = () => {
  const d = new Date();
  return formatDate(d);
};

/** Offset a "yyyy-MM-dd" string by `n` days (+/-) */
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return formatDate(d);
};

/** Difference in whole days between two "yyyy-MM-dd" strings */
const dayDiff = (a, b) => {
  const ms = new Date(b + "T00:00:00") - new Date(a + "T00:00:00");
  return Math.round(ms / 86400000);
};

/** Format a Date to "yyyy-MM-dd" */
const formatDate = (d) => d.toISOString().slice(0, 10);

module.exports = { calcStreaks, todayKey, addDays, formatDate };
