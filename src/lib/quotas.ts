"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FIREBASE_PREFIX, firestore } from "./firebase";

export type Provider = "claude" | "chatgpt";
export const providers: Provider[] = ["claude", "chatgpt"];

/** A subscription quota the user tracks by hand, e.g. "Claude Max · 5-hour window". */
export type Quota = {
  id: string;
  provider: Provider;
  label: string;
  usedPercent: number;
  resetAt: Date | null;
  updatedAt: Date | null;
};

export type QuotaInput = Omit<Quota, "id" | "updatedAt">;

/** Monthly API budgets in USD. */
export type Budgets = { anthropic: number | null; openai: number | null };

// Firestore layout (shared Firebase project, so everything lives under the "rxusage" root collection):
//   rxusage/{uid}/quotas/{quotaId}
//   rxusage/{uid}/settings/budgets
const quotasCol = (uid: string) => collection(firestore(), FIREBASE_PREFIX, uid, "quotas");
const budgetsDoc = (uid: string) => doc(firestore(), FIREBASE_PREFIX, uid, "settings", "budgets");

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);

export function watchQuotas(uid: string, cb: (q: Quota[]) => void, onError: (e: Error) => void) {
  // Sorted on the client: a two-field orderBy would need a composite index.
  return onSnapshot(
    quotasCol(uid),
    (snap) =>
      cb(
        snap.docs
          .map((d): Quota => {
          const v = d.data();
          return {
            id: d.id,
            provider: v.provider === "chatgpt" ? "chatgpt" : "claude",
            label: String(v.label ?? ""),
            usedPercent: Number(v.usedPercent ?? 0),
            resetAt: toDate(v.resetAt),
            updatedAt: toDate(v.updatedAt),
          };
        })
          .sort((a, b) => a.provider.localeCompare(b.provider) || a.label.localeCompare(b.label)),
      ),
    onError,
  );
}

const payload = (q: QuotaInput) => ({
  provider: q.provider,
  label: q.label.trim(),
  usedPercent: Math.min(100, Math.max(0, Math.round(q.usedPercent))),
  resetAt: q.resetAt ? Timestamp.fromDate(q.resetAt) : null,
  updatedAt: serverTimestamp(),
});

export const addQuota = (uid: string, q: QuotaInput) => addDoc(quotasCol(uid), payload(q));
export const updateQuota = (uid: string, id: string, q: QuotaInput) =>
  updateDoc(doc(quotasCol(uid), id), payload(q));
export const deleteQuota = (uid: string, id: string) => deleteDoc(doc(quotasCol(uid), id));

export function watchBudgets(uid: string, cb: (b: Budgets) => void, onError: (e: Error) => void) {
  return onSnapshot(
    budgetsDoc(uid),
    (snap) => {
      const v = snap.data() ?? {};
      const n = (x: unknown) => (typeof x === "number" && x > 0 ? x : null);
      cb({ anthropic: n(v.anthropic), openai: n(v.openai) });
    },
    onError,
  );
}

export const saveBudgets = (uid: string, b: Budgets) => setDoc(budgetsDoc(uid), b, { merge: true });
