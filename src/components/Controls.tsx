"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { locales, type Locale } from "@/i18n/dictionaries";
import { themeStore, type Theme } from "@/lib/theme";

const localeLabel: Record<Locale, string> = { th: "ไทย", en: "EN" };

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t.language} className="flex rounded-md border border-border p-0.5">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={`min-h-9 min-w-11 cursor-pointer rounded px-2.5 text-sm font-medium transition-colors duration-200 ${
            locale === l
              ? "bg-primary text-on-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {localeLabel[l]}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot, themeStore.getServerSnapshot);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => themeStore.set(next)}
      aria-label={next === "light" ? t.theme.light : t.theme.dark}
      title={t.theme.toggle}
      className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
    >
      {theme === "dark" ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  );
}
