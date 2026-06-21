import { Link } from "react-router-dom";
import { Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import Starfield from "./Starfield.jsx";
import AuthVisual from "./AuthVisual.jsx";

export default function AuthLayout({ children, variant = "login" }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="auth-page relative min-h-screen flex flex-col overflow-hidden">
      <Starfield />

      <div className="auth-page-glow" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-2" aria-hidden="true" />

      <header className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-5 max-w-6xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/35 group-hover:scale-105 transition-transform">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg tracking-tight">AI Habit Tracker</span>
        </Link>
        <button
          onClick={toggle}
          className="p-2.5 rounded-xl glass hover:bg-[var(--surface-hover)] transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="auth-unified-card w-full max-w-4xl animate-slide-up">
          <div className="auth-unified-inner grid lg:grid-cols-[1fr_1fr] rounded-3xl overflow-hidden">
            <div className="auth-visual-panel">
              <AuthVisual variant={variant} />
            </div>

            <div className="auth-form-panel p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
