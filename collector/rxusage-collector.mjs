#!/usr/bin/env node
/**
 * rxusage collector — reads your Claude and ChatGPT plan limits on this Mac and sends
 * only the numbers (used %, reset time) to rxusage's /api/limits.
 *
 *   Claude:  the Claude Code sign-in in the macOS Keychain ("Claude Code-credentials")
 *            → GET https://api.anthropic.com/api/oauth/usage (what Claude Code's /usage shows)
 *   ChatGPT: the Codex CLI sign-in in ~/.codex/auth.json
 *            → GET https://chatgpt.com/backend-api/wham/usage (what Codex's /status shows)
 *
 * Neither endpoint is a documented public API; they may change without notice.
 * Tokens are only read and never sent anywhere except to their own provider. The collector
 * does not refresh them: open Claude Code / Codex now and then and they refresh themselves.
 *
 * Config: ~/.config/rxusage/collector.json  { "url": "https://….pages.dev", "token": "…" }
 *         (or RXUSAGE_URL / RXUSAGE_TOKEN). `--dry-run` prints the snapshot without sending.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, ".config", "rxusage", "collector.json");
const TIMEOUT = 15_000;
const dryRun = process.argv.includes("--dry-run");

const log = (...a) => console.log(new Date().toISOString(), ...a);
const toIso = (v) => (v ? new Date(v).toISOString() : null);

function readConfig() {
  let file = {};
  try {
    file = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch {}
  return { url: process.env.RXUSAGE_URL || file.url, token: process.env.RXUSAGE_TOKEN || file.token };
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ---------------- Claude (claude.ai plan, shared with Claude Code) ---------------- */

function claudeCredentials() {
  let raw;
  if (process.platform === "darwin") {
    try {
      raw = execFileSync("security", ["find-generic-password", "-s", "Claude Code-credentials", "-w"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {}
  }
  if (!raw) {
    try {
      raw = readFileSync(path.join(HOME, ".claude", ".credentials.json"), "utf8");
    } catch {}
  }
  const c = raw ? JSON.parse(raw).claudeAiOauth : null;
  if (!c?.accessToken) throw new Error("Claude Code is not signed in on this Mac");
  return c;
}

const CLAUDE_WINDOWS = [
  ["five_hour", "5h", 300],
  ["seven_day", "7d", 10080],
  ["seven_day_opus", "7d_opus", 10080],
  ["seven_day_sonnet", "7d_sonnet", 10080],
];

async function claude() {
  const c = claudeCredentials();
  if (c.expiresAt && c.expiresAt < Date.now()) {
    throw new Error("Claude Code sign-in expired; open Claude Code to refresh it");
  }
  const body = await getJson("https://api.anthropic.com/api/oauth/usage", {
    Authorization: `Bearer ${c.accessToken}`,
    "anthropic-beta": "oauth-2025-04-20",
  });
  const windows = CLAUDE_WINDOWS.filter(([key]) => typeof body[key]?.utilization === "number").map(
    ([key, id, windowMinutes]) => ({
      id,
      usedPercent: body[key].utilization,
      resetsAt: toIso(body[key].resets_at),
      windowMinutes,
    }),
  );
  return { plan: c.subscriptionType ?? null, windows };
}

/* ---------------- ChatGPT (plan limits, shared with Codex) ---------------- */

const windowId = (minutes) => (minutes === 300 ? "5h" : minutes === 10080 ? "7d" : `${minutes}m`);

async function chatgpt() {
  let auth;
  try {
    auth = JSON.parse(readFileSync(path.join(process.env.CODEX_HOME || path.join(HOME, ".codex"), "auth.json"), "utf8"));
  } catch {
    throw new Error("Codex is not signed in on this Mac");
  }
  const t = auth.tokens;
  if (!t?.access_token) throw new Error("Codex is not signed in with ChatGPT");
  const body = await getJson("https://chatgpt.com/backend-api/wham/usage", {
    Authorization: `Bearer ${t.access_token}`,
    ...(t.account_id ? { "ChatGPT-Account-Id": t.account_id } : {}),
    "User-Agent": "codex_cli_rs",
  });
  const rl = body.rate_limit ?? {};
  const windows = [rl.primary_window, rl.secondary_window]
    .filter((w) => w && typeof w.used_percent === "number")
    .map((w) => {
      const windowMinutes = w.limit_window_seconds ? Math.round(w.limit_window_seconds / 60) : null;
      return {
        id: windowId(windowMinutes),
        usedPercent: w.used_percent,
        resetsAt: w.reset_at ? new Date(w.reset_at * 1000).toISOString() : null,
        windowMinutes,
      };
    });
  return { plan: body.plan_type ?? null, windows };
}

/* ---------------- main ---------------- */

async function collect(fn) {
  const collectedAt = new Date().toISOString();
  try {
    return { ...(await fn()), collectedAt, error: null };
  } catch (e) {
    return { plan: null, windows: [], collectedAt, error: e instanceof Error ? e.message : String(e) };
  }
}

const snapshot = { claude: await collect(claude), chatgpt: await collect(chatgpt) };

for (const [name, s] of Object.entries(snapshot)) {
  log(name, s.error ? `error: ${s.error}` : s.windows.map((w) => `${w.id} ${w.usedPercent}%`).join(", ") || "no windows");
}

if (dryRun) {
  console.log(JSON.stringify(snapshot, null, 2));
  process.exit(0);
}

const { url, token } = readConfig();
if (!url || !token) {
  log(`missing url/token: create ${CONFIG_PATH} (run collector/install.sh)`);
  process.exit(1);
}

try {
  const res = await fetch(new URL("/api/limits", url), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(snapshot),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  log("sent", res.status, (await res.text()).slice(0, 200));
  process.exit(res.ok ? 0 : 1);
} catch (e) {
  log("send failed:", e instanceof Error ? e.message : e);
  process.exit(1);
}
