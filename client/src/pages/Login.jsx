import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import AuthLayout from "../components/auth/AuthLayout.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(loc.state?.from || "/dashboard", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="login">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="text-sm text-muted mt-1">Log in to continue your streaks.</p>

      <div className="mt-6">
        <GoogleAuthButton
          onSuccess={() => navigate(loc.state?.from || "/dashboard", { replace: true })}
          onError={setErr}
        />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t divider" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--surface-strong)] px-2 text-faint">or</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {err && (
          <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="text-center mt-5 text-sm text-soft space-y-2">
        <p>
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 dark:text-brand-300 font-medium">
            Create one
          </Link>
        </p>
        <p className="text-xs">
          Demo: <span className="font-mono">demo@habittracker.io</span> /{" "}
          <span className="font-mono">demo1234</span>
        </p>
      </div>
    </AuthLayout>
  );
}
