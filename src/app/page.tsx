"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

// Static export has no server redirects, so route on the client once auth state is known.
export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? "/dashboard/" : "/login/");
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-muted-foreground" aria-busy="true">
      {t.loading}
    </main>
  );
}
