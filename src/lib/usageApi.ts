"use client";

import type { User } from "firebase/auth";

// Mirrors the response of functions/api/usage.ts.
export type ModelRow = { model: string; costUsd: number; inputTokens: number; outputTokens: number; requests: number };
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
export type UsageResponse = {
  periodStart: string;
  fetchedAt: string;
  anthropic: ProviderUsage;
  openai: ProviderUsage;
};

export class UsageApiError extends Error {
  constructor(public kind: "unauthorized" | "unavailable" | "failed") {
    super(kind);
  }
}

export async function fetchUsage(user: User): Promise<UsageResponse> {
  const token = await user.getIdToken();
  let res: Response;
  try {
    res = await fetch("/api/usage", { headers: { authorization: `Bearer ${token}` } });
  } catch {
    throw new UsageApiError("failed");
  }
  if (res.status === 401) throw new UsageApiError("unauthorized");
  // `next dev` has no Pages Functions: the route 404s or returns HTML.
  if (res.status === 404 || !res.headers.get("content-type")?.includes("application/json")) {
    throw new UsageApiError("unavailable");
  }
  if (!res.ok) throw new UsageApiError("failed");
  return res.json();
}
