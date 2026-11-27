"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { AlertTriangle, Clock, Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { fetchLimits, type LimitsResponse, type ProviderLimits } from "@/lib/limitsApi";
import { UsageApiError } from "@/lib/usageApi";
import { formatDateTime, formatDuration, ProgressBar } from "./format";
import { useNow } from "./useNow";

const PROVIDERS = ["claude", "chatgpt"] as const;
const STALE_MS = 15 * 60_000;
const POLL_MS = 60_000;

export function LiveLimitsSection({ user }: { user: User }) {
  const { t } = useI18n();
  const [data, setData] = useState<LimitsResponse | null>(null);
  const [error, setError] = useState<UsageApiError["kind"] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchLimits(user));
      setError(null);
    } catch (e) {
      setError(e instanceof UsageApiError ? e.kind : "failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load(); // eslint-disable-line react-hooks/set-state-in-effect
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const message = error
    ? t.api[error]
    : data && !data.configured
      ? t.limits.notConfigured
      : data && !data.claude && !data.chatgpt
        ? t.limits.noData
        : null;

  return (
    <section aria-labelledby="limits-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="limits-title" className="text-lg font-semibold">
            {t.limits.title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t.limits.hint}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 font-medium transition-colors duration-200 hover:bg-muted disabled:opacity-60"
        >
          {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <RefreshCw aria-hidden className="size-4" />}
          {t.limits.refresh}
        </button>
      </div>

      {message && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted p-4 text-sm">
          <AlertTriangle aria-hidden className="size-5 shrink-0 text-warning" />
          {message}
        </p>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2" aria-busy={loading}>
        {PROVIDERS.map((p) =>
          data ? (
            data[p] && <ProviderLimitsCard key={p} name={t.providers[p]} limits={data[p]} />
          ) : (
            !error && <div key={p} className="h-56 animate-pulse rounded-lg border border-border bg-card" aria-hidden />
          ),
        )}
      </div>
    </section>
  );
}

function ProviderLimitsCard({ name, limits }: { name: string; limits: ProviderLimits }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const collected = new Date(limits.collectedAt);
  const age = now > 0 ? now - collected.getTime() : 0;
  const stale = age > STALE_MS;

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{name}</h3>
        {limits.plan && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {limits.plan}
          </span>
        )}
      </header>

      {limits.windows.length === 0 && <p className="text-sm text-muted-foreground">{t.limits.noWindows}</p>}

      <ul className="flex flex-col gap-4">
        {limits.windows.map((w) => {
          const label = t.limits.windows[w.id] ?? w.id;
          const resetsAt = w.resetsAt ? new Date(w.resetsAt) : null;
          const msLeft = resetsAt && now > 0 ? resetsAt.getTime() - now : null;
          const passed = msLeft !== null && msLeft <= 0;
          const pct = passed ? 0 : w.usedPercent;
          return (
            <li key={w.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-mono text-2xl font-semibold">{Math.round(pct)}%</span>
              </div>
              <ProgressBar percent={pct} label={`${name} ${label} ${t.limits.used}`} />
              {resetsAt && (
                <p
                  className={`mt-1.5 flex items-center gap-1.5 text-xs ${passed ? "text-warning" : "text-muted-foreground"}`}
                >
                  <Clock aria-hidden className="size-3.5 shrink-0" />
                  {passed
                    ? t.limits.resetPassed
                    : msLeft !== null
                      ? `${t.limits.resetsIn} ${formatDuration(msLeft, t.time)} · ${formatDateTime(resetsAt, locale)}`
                      : formatDateTime(resetsAt, locale)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="mt-auto space-y-2 border-t border-border pt-3 text-xs">
        {limits.error && (
          <p role="alert" className="flex items-start gap-1.5 text-warning">
            <AlertTriangle aria-hidden className="size-4 shrink-0" />
            <span>
              {t.limits.lastError}: <span className="font-mono">{limits.error}</span>
            </span>
          </p>
        )}
        {stale && (
          <p className="flex items-start gap-1.5 text-warning">
            <AlertTriangle aria-hidden className="size-4 shrink-0" />
            {t.limits.stale}
          </p>
        )}
        <p className="text-muted-foreground" title={formatDateTime(collected, locale)}>
          {t.limits.updated}{" "}
          {now === 0
            ? formatDateTime(collected, locale)
            : age < 60_000
              ? t.limits.justNow
              : `${formatDuration(age, t.time)} ${t.limits.ago}`}
        </p>
      </footer>
    </article>
  );
}
