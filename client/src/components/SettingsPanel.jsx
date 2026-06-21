import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios.js";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export default function SettingsPanel({ onClose }) {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [morning, setMorning] = useState(user?.morningMotivation || false);
  const [emailNotifications, setEmailNotifications] = useState(
    user?.emailNotifications ?? true
  );
  const [weeklyReportEmail, setWeeklyReportEmail] = useState(
    user?.weeklyReportEmail || false
  );
  const [streakReminders, setStreakReminders] = useState(
    user?.streakReminders ?? true
  );
  const [compactView, setCompactView] = useState(user?.compactView || false);
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setMorning(user?.morningMotivation || false);
    setEmailNotifications(user?.emailNotifications ?? true);
    setWeeklyReportEmail(user?.weeklyReportEmail || false);
    setStreakReminders(user?.streakReminders ?? true);
    setCompactView(user?.compactView || false);
    setTimezone(user?.timezone || "UTC");
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const res = await api.put("/auth/profile", {
        name,
        morningMotivation: morning,
        emailNotifications,
        weeklyReportEmail,
        streakReminders,
        compactView,
        timezone,
      });
      updateUser(res.data.user);
      setMsg("Settings saved");
      onClose?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setErr("");
    setMsg("");
    try {
      await api.put("/auth/change-password", {
        currentPassword: currentPassword || undefined,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMsg("Password updated");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setErr("");
    try {
      await api.delete("/auth/account", {
        data: { password: deletePassword || undefined },
      });
      logout();
      navigate("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const isGoogleOnly = user?.authProvider === "google";

  return (
    <div className="space-y-6">
      {msg && (
        <div className="text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}
      {err && (
        <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Profile
        </h4>
        <div>
          <label className="label">Display name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input opacity-70" value={user?.email || ""} disabled />
        </div>
        <div className="flex items-center gap-2 text-xs text-faint">
          <span className="px-2 py-1 rounded-md glass capitalize">
            {user?.authProvider || "local"} sign-in
          </span>
          {user?.emailVerified && (
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600">
              Verified
            </span>
          )}
        </div>
        <div>
          <label className="label">Timezone</label>
          <select
            className="input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Preferences
        </h4>

        <label className="flex items-start gap-3 p-3 rounded-xl glass cursor-pointer hover:bg-[var(--surface-hover)]">
          <input
            type="checkbox"
            checked={morning}
            onChange={(e) => setMorning(e.target.checked)}
            className="mt-1 accent-brand-600"
          />
          <div>
            <div className="text-sm font-medium">Morning motivation</div>
            <div className="text-xs text-faint">
              Show a personalised AI message on the dashboard each morning.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl glass cursor-pointer hover:bg-[var(--surface-hover)]">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="mt-1 accent-brand-600"
          />
          <div>
            <div className="text-sm font-medium">Email notifications</div>
            <div className="text-xs text-faint">
              Receive habit reminders and important updates by email.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl glass cursor-pointer hover:bg-[var(--surface-hover)]">
          <input
            type="checkbox"
            checked={weeklyReportEmail}
            onChange={(e) => setWeeklyReportEmail(e.target.checked)}
            className="mt-1 accent-brand-600"
          />
          <div>
            <div className="text-sm font-medium">Weekly report email</div>
            <div className="text-xs text-faint">
              Get your AI weekly habit summary delivered to your inbox.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl glass cursor-pointer hover:bg-[var(--surface-hover)]">
          <input
            type="checkbox"
            checked={streakReminders}
            onChange={(e) => setStreakReminders(e.target.checked)}
            className="mt-1 accent-brand-600"
          />
          <div>
            <div className="text-sm font-medium">Streak reminders</div>
            <div className="text-xs text-faint">
              Alerts when you are close to breaking a streak.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl glass cursor-pointer hover:bg-[var(--surface-hover)]">
          <input
            type="checkbox"
            checked={compactView}
            onChange={(e) => setCompactView(e.target.checked)}
            className="mt-1 accent-brand-600"
          />
          <div>
            <div className="text-sm font-medium">Compact dashboard view</div>
            <div className="text-xs text-faint">
              Show more habits on screen with tighter spacing.
            </div>
          </div>
        </label>

        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-between p-3 rounded-xl glass hover:bg-[var(--surface-hover)] text-sm"
        >
          <span className="font-medium">Appearance</span>
          <span className="text-faint capitalize">{theme} mode</span>
        </button>
      </section>

      <section className="space-y-3 border-t divider pt-4">
        <h4 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Security
        </h4>
        <form onSubmit={changePassword} className="space-y-3">
          {!isGoogleOnly && (
            <div>
              <label className="label">Current password</label>
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}
          <div>
            <label className="label">
              {isGoogleOnly ? "Set a password" : "New password"}
            </label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-secondary w-full"
            disabled={passwordSaving}
          >
            {passwordSaving ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>

      <section className="space-y-3 border-t divider pt-4">
        <h4 className="text-sm font-semibold text-rose-500 uppercase tracking-wide">
          Danger zone
        </h4>
        {!isGoogleOnly && (
          <div>
            <label className="label">Confirm password to delete</label>
            <input
              className="input"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
            />
          </div>
        )}
        <button
          type="button"
          onClick={deleteAccount}
          className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-sm font-medium transition"
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete account"}
        </button>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t divider">
        {onClose && (
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        )}
        <button type="button" className="btn-primary" onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
