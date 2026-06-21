import { Link } from "react-router-dom";
import { Sparkles, Sun, Moon, Target, Flame, TrendingUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import OrbitingHabits from "../OrbitingHabits.jsx";

const highlights = [
  { icon: Target, text: "Track daily goals" },
  { icon: Flame, text: "Build streaks" },
  { icon: TrendingUp, text: "AI-powered insights" },
];

export default function AuthVisual({ variant = "login" }) {
  const title =
    variant === "register"
      ? "Start your journey to better habits"
      : "Welcome back, streak keeper";

  const subtitle =
    variant === "register"
      ? "Build lasting routines with AI coaching and beautiful insights."
      : "Your habits, streaks, and AI coach are waiting for you.";

  return (
    <div className="auth-visual relative flex flex-col justify-between h-full min-h-[280px] lg:min-h-0 p-6 sm:p-8 lg:p-10">
      <div className="auth-visual-glow" aria-hidden="true" />

      <div>
        <div className="inline-flex items-center gap-1.5 chip mb-4 bg-brand-500/15 text-brand-700 dark:text-brand-300">
          <Sparkles size={12} />
          AI-powered habit coach
        </div>
        <h2 className="text-2xl lg:text-3xl font-semibold leading-tight tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm text-soft leading-relaxed max-w-sm">{subtitle}</p>

        <ul className="mt-6 space-y-2.5 hidden sm:block">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-soft">
              <span className="w-7 h-7 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                <Icon size={14} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 lg:mt-8 flex items-end gap-4">
        <div className="relative flex-1 rounded-2xl overflow-hidden shadow-xl shadow-brand-500/15 border border-white/25 animate-float auth-hero-image-wrap max-w-[200px] lg:max-w-none">
          <img
            src="/images/auth-hero.png"
            alt=""
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
        <div className="hidden lg:block w-[130px] h-[130px] shrink-0 opacity-90">
          <OrbitingHabits />
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {["💧", "🏃", "📚", "🧘"].map((tag, i) => (
          <span
            key={tag}
            className="w-8 h-8 rounded-full glass text-sm flex items-center justify-center animate-float"
            style={{ animationDelay: `${-i * 0.5}s` }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
