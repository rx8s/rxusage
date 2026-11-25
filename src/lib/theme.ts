import { createPersistedStore } from "./persistedStore";

export type Theme = "light" | "dark";
const THEME_KEY = "rxusage-theme";

/** Runs before paint (inlined in <head>) so the saved theme applies without a flash. Dark is the default. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export const themeStore = createPersistedStore<Theme>(THEME_KEY, "dark", ["light", "dark"], (theme) => {
  document.documentElement.dataset.theme = theme;
});
