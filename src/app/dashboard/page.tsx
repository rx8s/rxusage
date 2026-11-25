"use client";

import { BarChart3, CheckCircle2, CircleDashed } from "lucide-react";
import { serviceConfig, type FirebaseService } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

const services: FirebaseService[] = ["auth", "firestore", "database", "storage", "analytics"];

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">{t.dashboard.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {t.dashboard.welcome}
        {user?.displayName || user?.email ? `, ${user.displayName || user.email}` : ""}
      </p>

      <section className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
        <BarChart3 aria-hidden className="size-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">{t.dashboard.emptyTitle}</h2>
        <p className="mt-1 max-w-md text-muted-foreground">{t.dashboard.emptyBody}</p>
      </section>

      <section aria-labelledby="services-title" className="mt-8">
        <h2 id="services-title" className="text-lg font-semibold">
          {t.dashboard.servicesTitle}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const ok = serviceConfig[s];
            return (
              <li key={s} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <span className="font-medium">{t.services[s]}</span>
                <span className={`flex items-center gap-1.5 text-sm ${ok ? "text-accent" : "text-muted-foreground"}`}>
                  {ok ? (
                    <CheckCircle2 aria-hidden className="size-4" />
                  ) : (
                    <CircleDashed aria-hidden className="size-4" />
                  )}
                  {ok ? t.dashboard.configured : t.dashboard.missing}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
