"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { saveBudgets, watchBudgets, type Budgets } from "@/lib/quotas";
import { fetchUsage, UsageApiError, type ProviderUsage, type UsageResponse } from "@/lib/usageApi";
import { formatCompact, formatDateTime, formatUsd, ProgressBar } from "./format";

type Key = "anthropic" | "openai";
const KEYS: Key[] = ["anthropic", "openai"];

export function ApiUsageSection({ user }: { user: User }) {
  const { t } = useI18n();
  const [data, setData] = useState<UsageResponse | null>(null);
  const [error, setError] = useState<UsageApiError["kind"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budgets>({ anthropic: null, openai: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchUsage(user));
    } catch (e) {
      setError(e instanceof UsageApiError ? e.kind : "failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch once on mount; setState happens after the request resolves.
    void load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  useEffect(() => watchBudgets(user.uid, setBudgets, () => {}), [user.uid]);

  return (
    <section aria-labelledby="api-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="api-title" className="text-lg font-semibold">
            {t.api.title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t.api.hint} · {t.api.delayNote}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 font-medium transition-colors duration-200 hover:bg-muted disabled:opacity-60"
        >
          {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <RefreshCw aria-hidden className="size-4" />}
          {t.api.refresh}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted p-4 text-sm">
          <AlertTriangle aria-hidden className="size-5 shrink-0 text-warning" />
          {t.api[error]}
        </p>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2" aria-busy={loading}>
        {KEYS.map((k) => (
          <ProviderCard
            key={k}
            name={t.providers[k]}
            usage={data?.[k] ?? null}
            budget={budgets[k]}
            onSaveBudget={(v) => saveBudgets(user.uid, { ...budgets, [k]: v })}
          />
        ))}
      </div>
    </section>
  );
}

function ProviderCard({
  name,
  usage,
  budget,
  onSaveBudget,
}: {
  name: string;
  usage: ProviderUsage | null;
  budget: number | null;
  onSaveBudget: (v: number | null) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const ok = usage && usage.configured && !("error" in usage) ? usage : null;
  const pct = ok && budget ? (ok.costUsd / budget) * 100 : null;

  async function submitBudget(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = Number(new FormData(e.currentTarget).get("budget"));
    await onSaveBudget(Number.isFinite(v) && v > 0 ? v : null);
    setEditing(false);
  }

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{name}</h3>
        {ok?.dataRefreshedAt && (
          <span className="text-xs text-muted-foreground">
            {t.api.dataAsOf} {formatDateTime(new Date(ok.dataRefreshedAt), locale)}
          </span>
        )}
      </header>

      {usage && !usage.configured && <p className="text-sm text-muted-foreground">{t.api.notConfigured}</p>}
      {usage && usage.configured && "error" in usage && (
        <p role="alert" className="text-sm text-destructive">
          {t.api.failed}: <span className="font-mono">{usage.error}</span>
        </p>
      )}

      {ok && (
        <>
          <div>
            <p className="text-sm text-muted-foreground">{t.api.cost}</p>
            <p className="font-mono text-3xl font-semibold">
              {formatUsd(ok.costUsd, locale)}
              {budget && (
                <span className="text-base font-normal text-muted-foreground"> / {formatUsd(budget, locale)}</span>
              )}
            </p>
            {pct !== null && (
              <div className="mt-2">
                <ProgressBar percent={pct} label={`${name} ${t.api.budget}`} />
              </div>
            )}
          </div>

          <dl className="grid grid-cols-3 gap-2 text-sm">
            {(
              [
                [t.api.inputTokens, ok.inputTokens],
                [t.api.outputTokens, ok.outputTokens],
                [t.api.requests, ok.requests],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-md bg-muted p-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-mono font-semibold">{formatCompact(v, locale)}</dd>
              </div>
            ))}
          </dl>

          {ok.models.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">{t.api.topModels}</p>
              <ul className="mt-1 divide-y divide-border text-sm">
                {ok.models.slice(0, 4).map((m) => (
                  <li key={m.model} className="flex justify-between gap-2 py-1.5">
                    <span className="truncate font-mono">{m.model}</span>
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {m.costUsd > 0 ? formatUsd(m.costUsd, locale) : `${formatCompact(m.inputTokens + m.outputTokens, locale)} tok`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!usage && <div className="h-24 animate-pulse rounded-md bg-muted" aria-hidden />}

      <div className="mt-auto border-t border-border pt-3 text-sm">
        {editing ? (
          <form onSubmit={submitBudget} className="flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="text-muted-foreground">{t.api.budget} (USD)</span>
              <input
                name="budget"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={budget ?? ""}
                className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-base"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-md bg-accent px-4 font-semibold text-on-accent hover:opacity-90"
            >
              {t.api.saveBudget}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {t.api.budget}: {budget ? formatUsd(budget, locale) : t.api.noBudget}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 cursor-pointer rounded-md px-3 font-medium text-accent hover:bg-muted"
            >
              {t.api.setBudget}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
