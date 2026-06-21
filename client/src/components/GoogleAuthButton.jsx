import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.522 0-10-4.477-10-10s4.478-10 10-10c2.482 0 4.744.91 6.478 2.411l5.657-5.657C33.64 10.11 29.028 8 24 8 14.059 8 6 16.059 6 26s8.059 18 18 18 18-8.059 18-18c0-1.212-.122-2.393-.389-3.517z"
    />
    <path
      fill="#FF3D00"
      d="M6 26c0-1.657.285-3.247.795-4.729l7.657 5.94C13.803 29.858 18.583 32 24 32c2.482 0 4.744-.91 6.478-2.411l5.657 5.657C33.64 41.89 29.028 44 24 44 14.059 44 6 35.941 6 26z"
    />
    <path
      fill="#4CAF50"
      d="M42.611 20.083H42V20H24v8h11.303c-1.182 3.22-4.514 5.6-8.303 5.6-3.789 0-7.121-2.38-8.303-5.6l-7.657 5.94C13.803 41.142 18.583 44 24 44c5.223 0 9.654-3.343 11.303-8z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.522 0-10-4.477-10-10s4.478-10 10-10c2.482 0 4.744.91 6.478 2.411l5.657-5.657C33.64 10.11 29.028 8 24 8 14.059 8 6 16.059 6 26s8.059 18 18 18 18-8.059 18-18c0-1.212-.122-2.393-.389-3.517z"
    />
  </svg>
);

const loadGsiScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-gsi");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

export default function GoogleAuthButton({
  onSuccess,
  onError,
  label = "Continue with Google",
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCredential = useCallback(
    async (response) => {
      setLoading(true);
      try {
        await loginWithGoogle(response.credential);
        onSuccess?.();
      } catch (e) {
        onError?.(e.response?.data?.message || "Google sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, onSuccess, onError]
  );

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: containerRef.current.offsetWidth || 360,
          logo_alignment: "left",
        });

        setGsiReady(true);
      })
      .catch(() => {
        if (!cancelled) onError?.("Failed to load Google sign-in");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredential, onError]);

  if (!clientId) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() =>
            onError?.(
              "Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to client/.env and restart the dev server."
            )
          }
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-sm font-medium transition shadow-sm"
        >
          <GoogleIcon />
          {label}
        </button>
        <p className="text-xs text-center text-faint">
          Google OAuth needs a Client ID in <span className="font-mono">client/.env</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[44px]">
      {!gsiReady && (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium opacity-70"
        >
          <GoogleIcon />
          {loading ? "Signing in..." : "Loading Google…"}
        </button>
      )}
      <div
        ref={containerRef}
        className={`w-full flex justify-center [&>div]:!w-full ${gsiReady ? "" : "hidden"}`}
      />
    </div>
  );
}
