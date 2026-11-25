"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Activity, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitch, ThemeToggle } from "@/components/Controls";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Client-side guard: pages are static, so protect data with Firebase Security Rules too.
  useEffect(() => {
    if (!loading && !user) router.replace("/login/");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground" aria-busy="true">
        {t.loading}
      </main>
    );
  }

  const nav = [{ href: "/dashboard/", label: t.nav.overview, icon: LayoutDashboard }];

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 border-r border-border bg-card transition-transform duration-200 md:static md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard/" className="flex items-center gap-2">
            <Activity aria-hidden className="size-6 text-accent" />
            <span className="font-mono text-lg font-semibold">{t.appName}</span>
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label={t.nav.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <nav aria-label={t.nav.menu} className="px-3 py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname === href.slice(0, -1);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setNavOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 ${
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {navOpen && (
        <div aria-hidden className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setNavOpen(false)} />
      )}

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center gap-2 border-b border-border px-4 md:px-8">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label={t.nav.menu}
            aria-expanded={navOpen}
            className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => signOut(firebaseAuth())}
              aria-label={t.nav.signOut}
              title={t.nav.signOut}
              className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <LogOut aria-hidden className="size-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
