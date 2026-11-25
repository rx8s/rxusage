"use client";

import { useEffect, useState } from "react";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { addQuota, deleteQuota, updateQuota, watchQuotas, type Quota } from "@/lib/quotas";
import { formatDateTime, formatDuration, ProgressBar } from "./format";
import { QuotaDialog } from "./QuotaDialog";
import { useNow } from "./useNow";

export function QuotaSection({ uid }: { uid: string }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const [quotas, setQuotas] = useState<Quota[] | null>(null);
  const [error, setError] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; quota: Quota | null }>({ open: false, quota: null });

  useEffect(
    () =>
      watchQuotas(
        uid,
        (q) => {
          setQuotas(q);
          setError(false);
        },
        () => setError(true),
      ),
    [uid],
  );

  return (
    <section aria-labelledby="quotas-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="quotas-title" className="text-lg font-semibold">
            {t.quotas.title}
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{t.quotas.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ open: true, quota: null })}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 font-semibold text-on-accent transition-opacity duration-200 hover:opacity-90"
        >
          <Plus aria-hidden className="size-4" />
          {t.quotas.add}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t.api.failed}
        </p>
      )}

      {quotas === null && !error && <p className="mt-4 text-muted-foreground">{t.loading}</p>}

      {quotas?.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          {t.quotas.empty}
        </p>
      )}

      {!!quotas?.length && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quotas.map((q) => {
            const msLeft = q.resetAt ? q.resetAt.getTime() - now : null;
            const passed = msLeft !== null && now > 0 && msLeft <= 0;
            return (
              <li key={q.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.providers[q.provider]}
                    </p>
                    <p className="truncate font-medium">{q.label}</p>
                  </div>
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => setDialog({ open: true, quota: q })}
                      aria-label={`${t.quotas.edit} ${q.label}`}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.quotas.confirmDelete)) deleteQuota(uid, q.id);
                      }}
                      aria-label={`${t.quotas.delete} ${q.label}`}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{t.quotas.used}</span>
                    <span className="font-mono text-base font-semibold">{q.usedPercent}%</span>
                  </div>
                  <ProgressBar percent={q.usedPercent} label={`${q.label} ${t.quotas.used}`} />
                </div>

                <p
                  className={`flex items-center gap-1.5 text-sm ${passed ? "text-warning" : "text-muted-foreground"}`}
                >
                  <Clock aria-hidden className="size-4 shrink-0" />
                  {!q.resetAt
                    ? t.quotas.noReset
                    : passed
                      ? t.quotas.resetPassed
                      : now > 0 && msLeft !== null
                        ? `${t.quotas.resetsIn} ${formatDuration(msLeft, t.time)} · ${formatDateTime(q.resetAt, locale)}`
                        : formatDateTime(q.resetAt, locale)}
                </p>
                {q.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    {t.quotas.updated} {formatDateTime(q.updatedAt, locale)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <QuotaDialog
        open={dialog.open}
        initial={dialog.quota}
        onClose={() => setDialog({ open: false, quota: null })}
        onSave={(input) => (dialog.quota ? updateQuota(uid, dialog.quota.id, input) : addQuota(uid, input)).then(() => {})}
      />
    </section>
  );
}
