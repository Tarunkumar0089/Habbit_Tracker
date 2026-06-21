// Local fallbacks when Gemini API is unavailable (quota, missing key, etc.)

const generateLocalWeeklyReport = ({ userName, habits, logs }) => {
  if (!habits.length) {
    return `Hey **${userName}**, you don't have any active habits yet this week.\n\nHead to **Habits** and add one or two small daily goals — even a single 2-minute habit is a great place to start. Consistency beats intensity every time.`;
  }

  const stats = habits
    .map((h) => {
      const count = logs.filter((l) => String(l.habitId) === String(h._id)).length;
      return { h, count, pct: Math.round((count / 7) * 100) };
    })
    .sort((a, b) => b.count - a.count);

  const total = stats.reduce((s, x) => s + x.count, 0);
  const maxPossible = habits.length * 7;
  const weekPct = Math.round((total / maxPossible) * 100);

  const stars = stats.filter((s) => s.count >= 5);
  const growing = stats.filter((s) => s.count >= 3 && s.count < 5);
  const needsLove = stats.filter((s) => s.count < 3);

  const lines = [];

  lines.push(
    `Hey **${userName}**, here's your week at a glance — **${total} completions** across ${habits.length} habits (${weekPct}% of your weekly targets).`
  );

  if (stars.length) {
    lines.push(
      `\n**What went well**\n${stars
        .map((s) => `- ${s.h.icon} **${s.h.name}** — ${s.count}/7 days (${s.pct}%)`)
        .join("\n")}`
    );
  }

  if (needsLove.length) {
    lines.push(
      `\n**Room to grow**\n${needsLove
        .map((s) => `- ${s.h.icon} **${s.h.name}** — ${s.count}/7 days; try anchoring it to an existing routine`)
        .join("\n")}`
    );
  } else if (growing.length) {
    lines.push(
      `\n**Building momentum**\n${growing
        .map((s) => `- ${s.h.icon} **${s.h.name}** — ${s.count}/7 days; one more day pushes this into a solid streak`)
        .join("\n")}`
    );
  }

  const tip =
    needsLove.length > 0
      ? `Pick **one** habit from "room to grow" and commit to just 2 minutes tomorrow — before coffee, after brushing teeth, or right after lunch.`
      : stars.length === stats.length
      ? `You're crushing it. Consider adding one stretch habit next week to keep things fresh without overloading yourself.`
      : `Stack your weakest habit onto your strongest — do **${needsLove[0]?.h.name || stats[stats.length - 1].h.name}** right after **${stars[0]?.h.name || stats[0].h.name}** to piggyback on momentum.`;

  lines.push(`\n**Tip for next week**\n${tip}`);
  lines.push(
    `\n*Generated locally — connect a valid Gemini API key for fully personalised AI reports.*`
  );

  return lines.join("\n");
};

const generateLocalMorningMotivation = ({ userName, streaks }) => {
  const active = streaks.filter((s) => s.current > 0).sort((a, b) => b.current - a.current);
  if (!active.length) {
    return `**${userName}**, today is a clean slate. Pick one habit and mark it done before noon — future you will thank you.`;
  }
  const top = active[0];
  return `**${userName}**, your **${top.name}** streak is at **${top.current} days** — that's real momentum. Protect it today with one small win before the day gets busy.`;
};

const generateLocalRecoveryPlan = ({ habit, longestStreak }) => {
  return `You had a **${longestStreak}-day** run on **${habit.name}** — that counts. Streaks break; what matters is coming back.\n\n**Day 1:** Do the smallest version of ${habit.name} (2 minutes max).\n**Day 2:** Repeat at the same time as Day 1.\n**Day 3:** Add one small extra — a little longer or a little more focus.\n\n**Tip:** Tie **${habit.name}** to something you already do daily so you don't have to rely on willpower alone.`;
};

module.exports = {
  generateLocalWeeklyReport,
  generateLocalMorningMotivation,
  generateLocalRecoveryPlan,
};
