const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
];

const getModelList = () => {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  if (fromEnv) return [fromEnv, ...DEFAULT_MODELS.filter((m) => m !== fromEnv)];
  return DEFAULT_MODELS;
};

let _genAI = null;
const getClient = () => {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      const err = new Error("GEMINI_API_KEY is not configured");
      err.statusCode = 503;
      err.code = "GEMINI_NOT_CONFIGURED";
      throw err;
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  }
  return _genAI;
};

const isRetryableGeminiError = (err) => {
  const msg = String(err?.message || "");
  return (
    err?.code === "GEMINI_NOT_CONFIGURED" ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("API key not valid") ||
    msg.includes("403")
  );
};

const parseGeminiError = (err) => {
  const msg = String(err?.message || "");
  if (msg.includes("429") || msg.includes("quota") || msg.includes("Quota exceeded")) {
    const e = new Error(
      "AI quota exceeded. Check your Gemini API plan, or wait a minute and try again."
    );
    e.statusCode = 503;
    e.code = "GEMINI_QUOTA";
    return e;
  }
  if (msg.includes("API key not valid") || msg.includes("403")) {
    const e = new Error("Invalid Gemini API key. Get a key from https://aistudio.google.com/apikey");
    e.statusCode = 503;
    e.code = "GEMINI_AUTH";
    return e;
  }
  const e = new Error("AI service temporarily unavailable. Please try again.");
  e.statusCode = 503;
  e.code = "GEMINI_ERROR";
  return e;
};

const generateText = async (prompt, generationConfig = {}) => {
  const genAI = getClient();
  const models = getModelList();
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
          ...generationConfig,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text?.trim()) throw new Error("Empty response from model");
      return text;
    } catch (err) {
      lastError = err;
      if (!isRetryableGeminiError(err)) throw parseGeminiError(err);
    }
  }

  throw parseGeminiError(lastError || new Error("All Gemini models failed"));
};

const generateWeeklyReport = async ({ userName, habits, logs }) => {
  const habitLines = habits
    .map((h) => {
      const hLogs = logs.filter((l) => String(l.habitId) === String(h._id));
      return `- ${h.icon} ${h.name} (${h.category}): ${hLogs.length}/7 completions this week`;
    })
    .join("\n");

  const prompt = `
You are a supportive habit coach. Write a personal weekly review for ${userName}.

Here is their habit data for the last 7 days:
${habitLines || "No habits tracked this week."}

Write 2-4 short paragraphs:
1. Celebrate what went well (name specific habits).
2. Spot a pattern or trend in the data.
3. Give one actionable, encouraging tip for next week.

Use markdown formatting (bold for habit names). Keep it warm, honest, and under 200 words.
`.trim();

  return generateText(prompt);
};

const generateHabitSuggestions = async ({ goals, productiveTime, struggles }) => {
  const prompt = `
You are an expert habit coach. Based on the following user profile, suggest exactly 3 personalised habits.

User profile:
- Goals: ${goals}
- Most productive time: ${productiveTime}
- Past habit struggles: ${struggles}

Return ONLY valid JSON — an array of exactly 3 objects with these keys:
{
  "name": string,
  "description": string,
  "category": string,
  "frequency": string,
  "icon": string,
  "reason": string
}

Respond with ONLY the JSON array, no markdown, no explanation.
`.trim();

  const raw = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 800,
  });

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let suggestions;
  try {
    suggestions = JSON.parse(cleaned);
    if (!Array.isArray(suggestions)) throw new Error("not an array");
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) suggestions = JSON.parse(match[0]);
    else throw new Error("Gemini returned invalid JSON for habit suggestions");
  }

  return suggestions.slice(0, 3);
};

const generateRecoveryPlan = async ({ habit, longestStreak, daysBroken }) => {
  const prompt = `
You are an empathetic habit coach. A user broke their "${habit.name}" habit streak.

Context:
- Habit: ${habit.name} (${habit.category})
- Description: ${habit.description || "none"}
- Longest streak they ever achieved: ${longestStreak} days
- Days since last completion: ${daysBroken}

Write a short, warm 3-day comeback plan using markdown. Keep it under 180 words.
`.trim();

  return generateText(prompt);
};

const generateMorningMotivation = async ({ userName, habits, streaks }) => {
  const topStreaks = streaks
    .filter((s) => s.current > 0)
    .sort((a, b) => b.current - a.current)
    .slice(0, 3)
    .map((s) => `${s.icon} ${s.name} (${s.current}-day streak)`)
    .join(", ");

  const prompt = `
Write a short (2-3 sentence) personalised morning motivation message for ${userName}.
Active streaks: ${topStreaks || "no active streaks yet"}
Be warm and under 60 words. Use markdown sparingly.
`.trim();

  return generateText(prompt, { maxOutputTokens: 256, temperature: 0.9 });
};

const generateChatResponse = async ({ question, userName, habits, logs30 }) => {
  const summary = habits
    .map((h) => {
      const count = logs30.filter((l) => String(l.habitId) === String(h._id)).length;
      return `  - ${h.icon} ${h.name} (${h.category}): ${count}/30 completions`;
    })
    .join("\n");

  const prompt = `
You are a helpful AI habit analyst for ${userName}.

Habit Data (last 30 days):
${summary || "No habits found."}

User's question: "${question}"

Answer in 2-4 sentences. Be specific. Use markdown if helpful.
`.trim();

  return generateText(prompt, { maxOutputTokens: 512, temperature: 0.7 });
};

module.exports = {
  generateText,
  generateWeeklyReport,
  generateHabitSuggestions,
  generateRecoveryPlan,
  generateMorningMotivation,
  generateChatResponse,
  isRetryableGeminiError,
};
