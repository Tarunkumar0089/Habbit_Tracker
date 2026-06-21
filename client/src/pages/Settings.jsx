import SettingsPanel from "../components/SettingsPanel.jsx";

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Manage your profile, notifications, and account security.
        </p>
      </div>
      <div className="card p-6">
        <SettingsPanel />
      </div>
    </div>
  );
}
