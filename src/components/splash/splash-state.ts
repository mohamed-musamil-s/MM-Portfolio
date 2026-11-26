"use client";

import { useSyncExternalStore } from "react";

/*
 * Whether the page underneath may start its own entrance: true once the
 * name splash starts its exit, or straight away when no splash plays. Page
 * sections read it with `useIntroReady()` so their entrances are seen, not
 * played behind the splash.
 */

let ready = false;
const listeners = new Set<() => void>();

export const markIntroReady = () => {
  if (ready) {
    return;
  }
  ready = true;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useIntroReady = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
