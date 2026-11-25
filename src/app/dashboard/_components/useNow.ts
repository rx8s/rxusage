"use client";

import { useSyncExternalStore } from "react";

// One shared 30-second clock for countdowns.
const listeners = new Set<() => void>();
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(l: () => void) {
  listeners.add(l);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((fn) => fn());
    }, 30_000);
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export const useNow = () =>
  useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
