import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import AuthLayout from "../components/auth/AuthLayout.jsx";

const OrDivider = () => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t divider" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-[var(--surface-strong)] px-2 text-faint">or</span>
    </div>
  </div>
);

export default function Register() {
  const { user, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const requestOtp = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const data = await sendOtp(form.name, form.email, form.password);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep(2);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await verifyOtp(form.email, otp);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="register">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center text-brand-600 dark:text-brand-300">
          {step === 1 ? <Mail size={20} /> : <ShieldCheck size={20} />}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">
            {step === 1 ? "Create your account" : "Verify your email"}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {step === 1
              ? "Free forever. Verify your email to get started."
              : "Enter the 6-digit code we sent to your email."}
          </p>
        </div>
      </div>

      {step === 1 && (
        <>
          <div className="mt-6">
            <GoogleAuthButton
              label="Sign up with Google"
              onSuccess={() => navigate("/dashboard", { replace: true })}
              onError={setErr}
            />
          </div>
          <OrDivider />
        </>
      )}

      {step === 1 ? (
        <form onSubmit={requestOtp} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={set("name")}
              placeholder="Your name"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="At least 6 characters"
              required
            />
          </div>
          {err && (
            <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmOtp} className="mt-6 space-y-4">
          <p className="text-sm text-soft">
            Code sent to <span className="font-medium">{form.email}</span>
          </p>
          {devOtp && (
            <div className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Dev mode — your code is: <span className="font-mono font-bold">{devOtp}</span>
            </div>
          )}
          <div>
            <label className="label">Verification code</label>
            <input
              className="input text-center text-lg tracking-[0.4em] font-mono"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={6}
            />
          </div>
          {err && (
            <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={loading || otp.length !== 6}
          >
            {loading ? "Verifying..." : "Verify & create account"}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              setStep(1);
              setOtp("");
              setDevOtp("");
              setErr("");
            }}
          >
            Back
          </button>
        </form>
      )}

      <div className="text-center mt-5 text-sm text-soft">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-600 dark:text-brand-300 font-medium">
          Log in
        </Link>
      </div>
    </AuthLayout>
  );
}
