/**
 * Cloudflare Pages Function: GET /api/usage
 *
 * Returns month-to-date (UTC) API cost and token usage from Anthropic and OpenAI.
 * Admin keys stay here on the server; the browser only sends its Firebase ID token.
 *
 * Environment variables (Cloudflare Pages → Settings → Variables and Secrets, or .dev.vars locally):
 *   FIREBASE_PROJECT_ID   Firebase project ID (token audience)
 *   ALLOWED_EMAIL         The only (verified) email allowed to read this data
 *   ANTHROPIC_ADMIN_KEY   sk-ant-admin... (optional)
 *   OPENAI_ADMIN_KEY      OpenAI admin key (optional)
 */
import { json, verifyUser, type AuthEnv } from "../_lib/auth";

interface Env extends AuthEnv {
  ANTHROPIC_ADMIN_KEY?: string;
  OPENAI_ADMIN_KEY?: string;
}

type ModelRow = { model: string; costUsd: number; inputTokens: number; outputTokens: number; requests: number };

export type ProviderUsage =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true;
      costUsd: number;
      inputTokens: number;
      outputTokens: number;
      requests: number;
      models: ModelRow[];
      dataRefreshedAt: string | null;
    };

function monthStartUtc(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function row(map: Map<string, ModelRow>, model: string) {
  let r = map.get(model);
  if (!r) map.set(model, (r = { model, costUsd: 0, inputTokens: 0, outputTokens: 0, requests: 0 }));
  return r;
}

function summarize(map: Map<string, ModelRow>, dataRefreshedAt: string | null): ProviderUsage {
  const models = [...map.values()].sort((a, b) => b.costUsd - a.costUsd);
  const sum = (k: keyof Omit<ModelRow, "model">) => models.reduce((n, m) => n + m[k], 0);
  return {
    configured: true,
    costUsd: sum("costUsd"),
    inputTokens: sum("inputTokens"),
    outputTokens: sum("outputTokens"),
    requests: sum("requests"),
    models,
    dataRefreshedAt,
  };
}

/* ---------------- Anthropic: Usage and Cost Analytics API (beta) ---------------- */

type AnthropicPage<T> = { data: T[]; has_more: boolean; next_page: string | null; data_refreshed_at: string | null };
type AnthropicUsageRow = {
  group: { model: string | null };
  usage: {
    uncached_input_tokens: number;
    cache_creation?: { ephemeral_1h_input_tokens?: number; ephemeral_5m_input_tokens?: number };
    cache_read_input_tokens: number;
    output_tokens: number;
    requests: number;
  };
};
type AnthropicCostRow = { group: { model: string | null }; cost: { currency: string; amount: string } };

async function anthropicPages<T>(path: string, params: URLSearchParams, key: string) {
  const rows: T[] = [];
  let refreshed: string | null = null;
  let page: string | null = null;
  for (let i = 0; i < 20; i++) {
    const q = new URLSearchParams(params);
    if (page) q.set("page", page);
    const res = await fetch(`https://api.anthropic.com/v1/organizations/analytics/${path}?${q}`, {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2026-10-21",
        "anthropic-beta": "analytics-usage-cost-2026-08-24",
      },
    });
    if (!res.ok) throw new Error(`Anthropic ${path}: HTTP ${res.status}`);
    const body = (await res.json()) as AnthropicPage<T>;
    rows.push(...body.data);
    refreshed = body.data_refreshed_at;
    if (!body.has_more || !body.next_page) break;
    page = body.next_page;
  }
  return { rows, refreshed };
}

async function anthropicUsage(key: string, start: Date): Promise<ProviderUsage> {
  const params = new URLSearchParams({ starting_at: start.toISOString(), limit: "1000" });
  params.append("group_by[]", "model");

  const [usage, cost] = await Promise.all([
    anthropicPages<AnthropicUsageRow>("usage", params, key),
    anthropicPages<AnthropicCostRow>("cost", params, key),
  ]);

  const map = new Map<string, ModelRow>();
  for (const r of usage.rows) {
    const m = row(map, r.group.model ?? "other");
    const u = r.usage;
    m.inputTokens +=
      u.uncached_input_tokens +
      u.cache_read_input_tokens +
      (u.cache_creation?.ephemeral_1h_input_tokens ?? 0) +
      (u.cache_creation?.ephemeral_5m_input_tokens ?? 0);
    m.outputTokens += u.output_tokens;
    m.requests += u.requests ?? 0;
  }
  for (const r of cost.rows) {
    // `amount` is a decimal string in US cents.
    row(map, r.group.model ?? "other").costUsd += Number(r.cost.amount) / 100;
  }
  return summarize(map, cost.refreshed ?? usage.refreshed);
}

/* ---------------- OpenAI: organization Costs + Completions usage ---------------- */

type OpenAIPage<T> = { data: { results: T[] }[]; has_more: boolean; next_page: string | null };
type OpenAICostResult = { amount?: { value: number; currency: string }; line_item: string | null };
type OpenAIUsageResult = { model: string | null; input_tokens: number; output_tokens: number; num_model_requests: number };

async function openaiPages<T>(path: string, params: URLSearchParams, key: string) {
  const results: T[] = [];
  let page: string | null = null;
  for (let i = 0; i < 20; i++) {
    const q = new URLSearchParams(params);
    if (page) q.set("page", page);
    const res = await fetch(`https://api.openai.com/v1/organization/${path}?${q}`, {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`OpenAI ${path}: HTTP ${res.status}`);
    const body = (await res.json()) as OpenAIPage<T>;
    for (const bucket of body.data) results.push(...bucket.results);
    if (!body.has_more || !body.next_page) break;
    page = body.next_page;
  }
  return results;
}

async function openaiUsage(key: string, start: Date): Promise<ProviderUsage> {
  const start_time = String(Math.floor(start.getTime() / 1000));
  const costParams = new URLSearchParams({ start_time, bucket_width: "1d", limit: "31" });
  costParams.append("group_by", "line_item");
  const usageParams = new URLSearchParams({ start_time, bucket_width: "1d", limit: "31" });
  usageParams.append("group_by", "model");

  const [costs, usage] = await Promise.all([
    openaiPages<OpenAICostResult>("costs", costParams, key),
    openaiPages<OpenAIUsageResult>("usage/completions", usageParams, key),
  ]);

  const map = new Map<string, ModelRow>();
  for (const u of usage) {
    const m = row(map, u.model ?? "other");
    m.inputTokens += u.input_tokens;
    m.outputTokens += u.output_tokens;
    m.requests += u.num_model_requests;
  }
  // Costs are reported per line item (not per model); keep the total separately.
  const total = costs.reduce((n, c) => n + (c.amount?.value ?? 0), 0);
  const summary = summarize(map, null);
  return summary.configured && "costUsd" in summary ? { ...summary, costUsd: total } : summary;
}

async function safe(fn: () => Promise<ProviderUsage>): Promise<ProviderUsage> {
  try {
    return await fn();
  } catch (e) {
    return { configured: true, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!(await verifyUser(request, env))) return json({ error: "unauthorized" }, 401);

  const now = new Date();
  const start = monthStartUtc(now);
  const [anthropic, openai] = await Promise.all([
    env.ANTHROPIC_ADMIN_KEY ? safe(() => anthropicUsage(env.ANTHROPIC_ADMIN_KEY!, start)) : { configured: false as const },
    env.OPENAI_ADMIN_KEY ? safe(() => openaiUsage(env.OPENAI_ADMIN_KEY!, start)) : { configured: false as const },
  ]);

  return json({ periodStart: start.toISOString(), fetchedAt: now.toISOString(), anthropic, openai });
}
