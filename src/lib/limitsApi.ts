"use client";

import type { User } from "firebase/auth";
import { fetchApi } from "./usageApi";

// Mirrors the response of functions/api/limits.ts.
export type LimitWindow = { id: string; usedPercent: number; resetsAt: string | null; windowMinutes: number | null };
export type ProviderLimits = {
  plan: string | null;
  windows: LimitWindow[];
  collectedAt: string;
  error: string | null;
  errorAt: string | null;
};
export type LimitsResponse = { configured: boolean; claude: ProviderLimits | null; chatgpt: ProviderLimits | null };

export const fetchLimits = (user: User) => fetchApi<LimitsResponse>(user, "/api/limits");
