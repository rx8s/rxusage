"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { providers, type Provider, type Quota, type QuotaInput } from "@/lib/quotas";

/** yyyy-MM-ddTHH:mm in local time, for <input type="datetime-local">. */
function toLocalInput(d: Date | null) {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  initial: Quota | null;
  onClose: () => void;
  onSave: (q: QuotaInput) => Promise<void>;
};

export function QuotaDialog({ open, initial, onClose, onSave }: Props) {
  const { t } = useI18n();
  const f = t.quotas.form;
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [labelError, setLabelError] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const label = String(data.get("label") ?? "").trim();
    if (!label) {
      setLabelError(true);
      return;
    }
    const reset = String(data.get("resetAt") ?? "");
    setBusy(true);
    try {
      await onSave({
        provider: data.get("provider") as Provider,
        label,
        usedPercent: Number(data.get("usedPercent") ?? 0),
        resetAt: reset ? new Date(reset) : null,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 block w-full min-h-11 rounded-md border border-border bg-background px-3 text-base text-foreground";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="quota-dialog-title"
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg border border-border bg-card p-0 text-card-foreground backdrop:bg-black/60"
    >
      {open && (
        <form key={initial?.id ?? "new"} onSubmit={submit} className="space-y-4 p-6" noValidate>
          <h2 id="quota-dialog-title" className="text-lg font-semibold">
            {initial ? f.editTitle : f.addTitle}
          </h2>

          <fieldset>
            <legend className="text-sm font-medium">{f.provider}</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {providers.map((p) => (
                <label
                  key={p}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3 has-[:checked]:border-accent has-[:checked]:bg-muted"
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p}
                    defaultChecked={(initial?.provider ?? "claude") === p}
                    className="accent-[var(--accent)]"
                  />
                  {t.providers[p]}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="q-label" className="text-sm font-medium">
              {f.label}
            </label>
            <input
              id="q-label"
              name="label"
              defaultValue={initial?.label}
              maxLength={60}
              aria-invalid={labelError}
              aria-describedby="q-label-hint"
              onChange={() => setLabelError(false)}
              className={field}
            />
            <p id="q-label-hint" className={`mt-1 text-sm ${labelError ? "text-destructive" : "text-muted-foreground"}`}>
              {labelError ? f.labelRequired : f.labelHint}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-used" className="text-sm font-medium">
                {f.usedPercent}
              </label>
              <input
                id="q-used"
                name="usedPercent"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                defaultValue={initial?.usedPercent ?? 0}
                className={`${field} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="q-reset" className="text-sm font-medium">
                {f.resetAt}
              </label>
              <input
                id="q-reset"
                name="resetAt"
                type="datetime-local"
                defaultValue={toLocalInput(initial?.resetAt ?? null)}
                className={field}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 cursor-pointer rounded-md border border-border px-4 font-medium hover:bg-muted"
            >
              {f.cancel}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {f.save}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
