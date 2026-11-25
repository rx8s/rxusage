"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { ApiUsageSection } from "./_components/ApiUsageSection";
import { QuotaSection } from "./_components/QuotaSection";

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  if (!user) return null; // layout guards this route

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">{t.dashboard.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.dashboard.welcome}
          {user.displayName || user.email ? `, ${user.displayName || user.email}` : ""} · {t.dashboard.subtitle}
        </p>
      </header>
      <QuotaSection uid={user.uid} />
      <ApiUsageSection user={user} />
    </div>
  );
}
