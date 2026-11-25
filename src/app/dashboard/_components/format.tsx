import type { Dictionary, Locale } from "@/i18n/dictionaries";

const intlLocale = (l: Locale) => (l === "th" ? "th-TH" : "en-US");

export const formatUsd = (n: number, l: Locale) =>
  new Intl.NumberFormat(intlLocale(l), { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export const formatCompact = (n: number, l: Locale) =>
  new Intl.NumberFormat(intlLocale(l), { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const formatDateTime = (d: Date, l: Locale) =>
  new Intl.DateTimeFormat(intlLocale(l), { dateStyle: "medium", timeStyle: "short" }).format(d);

/** "2d 3h", "4h 15m", "12m" — the largest two units. */
export function formatDuration(ms: number, t: Dictionary["time"]) {
  const mins = Math.max(0, Math.ceil(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d) return `${d} ${t.d} ${h} ${t.h}`;
  if (h) return `${h} ${t.h} ${m} ${t.m}`;
  return `${m} ${t.m}`;
}

/** Bar color by fill level: green → amber at 70% → red at 90%. */
export const levelClass = (pct: number) =>
  pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-accent";

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div className={`h-full rounded-full ${levelClass(p)}`} style={{ width: `${p}%` }} />
    </div>
  );
}
