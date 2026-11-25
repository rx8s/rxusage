"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPersistedStore } from "@/lib/persistedStore";
import { defaultLocale, dictionaries, locales, type Dictionary, type Locale } from "./dictionaries";

const localeStore = createPersistedStore<Locale>("rxusage-locale", defaultLocale, locales);

type I18nValue = { locale: Locale; t: Dictionary; setLocale: (l: Locale) => void };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale: localeStore.set }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
