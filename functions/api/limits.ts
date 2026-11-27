/**
 * Cloudflare Pages Function: /api/limits
 *
 * Plan limits (claude.ai / ChatGPT) pushed by the Mac collector in `collector/`.
 *   POST  collector → stores the latest snapshot per provider in KV.
 *         Auth: `Authorization: Bearer <ingest token>`; only the token's SHA-256 is kept on the server.
 *   GET   dashboard → returns the stored snapshots. Auth: Firebase ID token for ALLOWED_EMAIL.
 *
 * Bindings / variables (Cloudflare Pages → Settings):
 *   LIMITS                       KV namespace binding
 *   LIMITS_INGEST_TOKEN_SHA256   hex SHA-256 of the collector's token (printed by collector/install.sh)
 *   FIREBASE_PROJECT_ID, ALLOWED_EMAIL  (shared with /api/usage)
 */
import { bearer, json, sha256Hex, verifyUser, type AuthEnv } from "../_lib/auth";

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env extends AuthEnv {
  LIMITS?: KV;
  LIMITS_INGEST_TOKEN_SHA256?: string;
}

const PROVIDERS = ["claude", "chatgpt"] as const;
type Provider = (typeof PROVIDERS)[number];

export type LimitWindow = { id: string; usedPercent: number; resetsAt: string | null; windowMinutes: number | null };
export type ProviderLimits = {
  plan: string | null;
  windows: LimitWindow[];
  collectedAt: string;
  /** Set when the latest collection failed; `windows` then hold the last good values. */
  error: string | null;
  errorAt: string | null;
};

const str = (v: unknown, max = 200) => (typeof v === "string" && v.length <= max ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const iso = (v: unknown) => {
  const s = str(v, 64);
  return s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null;
};

/** Validates one provider entry from the collector; returns null if it is malformed. */
function parseProvider(v: unknown): ProviderLimits | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const collectedAt = iso(o.collectedAt);
  if (!collectedAt || !Array.isArray(o.windows) || o.windows.length > 10) return null;
  const windows: LimitWindow[] = [];
  for (const w of o.windows as Record<string, unknown>[]) {
    const id = str(w?.id, 40);
    const usedPercent = num(w?.usedPercent);
    if (!id || usedPercent === null) return null;
    windows.push({
      id,
      usedPercent: Math.min(100, Math.max(0, usedPercent)),
      resetsAt: iso(w.resetsAt),
      windowMinutes: num(w.windowMinutes),
    });
  }
  return { plan: str(o.plan, 40), windows, collectedAt, error: str(o.error, 500), errorAt: null };
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const token = bearer(request);
  if (!token || !env.LIMITS_INGEST_TOKEN_SHA256) return json({ error: "unauthorized" }, 401);
  if ((await sha256Hex(token)) !== env.LIMITS_INGEST_TOKEN_SHA256.trim().toLowerCase()) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!env.LIMITS) return json({ error: "kv_not_bound" }, 503);

  const text = await request.text();
  if (text.length > 16_000) return json({ error: "too_large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const saved: Provider[] = [];
  for (const p of PROVIDERS) {
    if (!(p in body)) continue;
    const next = parseProvider(body[p]);
    if (!next) return json({ error: `bad_${p}` }, 400);
    if (next.error) {
      // Keep the last good numbers and flag the failure.
      const prevRaw = await env.LIMITS.get(p);
      const prev = prevRaw ? (JSON.parse(prevRaw) as ProviderLimits) : null;
      const merged: ProviderLimits = prev?.windows.length
        ? { ...prev, error: next.error, errorAt: next.collectedAt }
        : { ...next, errorAt: next.collectedAt };
      await env.LIMITS.put(p, JSON.stringify(merged));
    } else {
      await env.LIMITS.put(p, JSON.stringify(next));
    }
    saved.push(p);
  }
  return json({ ok: true, saved });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!(await verifyUser(request, env))) return json({ error: "unauthorized" }, 401);
  if (!env.LIMITS) return json({ configured: false, claude: null, chatgpt: null });

  const [claude, chatgpt] = await Promise.all(
    PROVIDERS.map(async (p) => {
      const raw = await env.LIMITS!.get(p);
      return raw ? (JSON.parse(raw) as ProviderLimits) : null;
    }),
  );
  return json({ configured: true, claude, chatgpt });
}
