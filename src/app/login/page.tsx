"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitch, ThemeToggle } from "@/components/Controls";

// Closing the popup is not an error worth showing.
const QUIET_ERRORS = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

export default function LoginPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/dashboard/");
  }, [user, router]);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseAuth(), provider);
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : "unknown";
      if (!QUIET_ERRORS.has(code)) {
        setError(code === "auth/unauthorized-domain" ? t.login.unauthorizedDomain : t.login.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-end gap-2 p-4">
        <LanguageSwitch />
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <Activity aria-hidden className="size-7 text-accent" />
            <span className="font-mono text-xl font-semibold">{t.appName}</span>
          </div>
          <h1 className="text-2xl font-semibold">{t.login.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.login.subtitle}</p>

          {!isFirebaseConfigured && (
            <div role="alert" className="mt-6 flex gap-3 rounded-md border border-border bg-muted p-4 text-sm">
              <AlertTriangle aria-hidden className="size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold">{t.setup.title}</p>
                <p className="mt-1 text-muted-foreground">{t.setup.body}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={busy || !isFirebaseConfigured}
            onClick={signIn}
            aria-describedby={error ? "login-error" : undefined}
            className="mt-8 flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-border bg-card px-4 font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <GoogleLogo />}
            {busy ? t.login.submitting : t.login.google}
          </button>

          {error && (
            <p id="login-error" role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <p className="mt-6 text-sm text-muted-foreground">{t.login.note}</p>
        </div>
      </div>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
