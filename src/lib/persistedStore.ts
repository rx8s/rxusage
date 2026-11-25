/**
 * A tiny localStorage-backed store for useSyncExternalStore.
 * Static HTML renders with `fallback`; the saved value is picked up on hydration without setState-in-effect.
 */
export function createPersistedStore<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
  onChange?: (value: T) => void,
) {
  const listeners = new Set<() => void>();

  const get = (): T => {
    try {
      const v = localStorage.getItem(key);
      return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: get,
    getServerSnapshot: () => fallback,
    set(value: T) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* storage unavailable */
      }
      onChange?.(value);
      listeners.forEach((l) => l());
    },
  };
}
