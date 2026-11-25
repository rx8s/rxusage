"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitch, ThemeToggle } from "@/components/Controls";

export default function LoginPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard/");
  }, [user, router]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(() => signInWithEmailAndPassword(firebaseAuth(), email, password));
  }

  const inputClass =
    "mt-1.5 block w-full min-h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 disabled:opacity-60";

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

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                {t.login.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy || !isFirebaseConfigured}
                aria-invalid={error}
                aria-describedby={error ? "login-error" : undefined}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                {t.login.password}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy || !isFirebaseConfigured}
                aria-invalid={error}
                aria-describedby={error ? "login-error" : undefined}
                className={inputClass}
              />
            </div>

            {error && (
              <p id="login-error" role="alert" className="text-sm text-destructive">
                {t.login.error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !isFirebaseConfigured}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-4 font-semibold text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {busy ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.login.or}
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            disabled={busy || !isFirebaseConfigured}
            onClick={() => run(() => signInWithPopup(firebaseAuth(), new GoogleAuthProvider()))}
            className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border px-4 font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.login.google}
          </button>
        </div>
      </div>
    </main>
  );
}
