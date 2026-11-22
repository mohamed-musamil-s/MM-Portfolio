"use client";

import { useEffect, useState } from "react";
import { ROUTES } from "@/lib/shared/routes";
import { useSecondClock } from "./useSecondClock";

type StatusResponse = { ok: true; data: { maintenance: boolean } } | { ok: false };

export type LiveCheck = {
  /** When the last successful check finished (ms), or null before the first one. */
  lastCheckedAt: number | null;
  /** Whole seconds until the next check. */
  secondsToNext: number;
  /** 0..1 through the current interval. */
  progress: number;
};

/**
 * Polls /api/status on load and then every `intervalSeconds`. As soon as the
 * admin switches maintenance off, it sends the visitor to the site; while it
 * stays on, it just records the check time for the footer.
 */
export const useLiveCheck = (intervalSeconds: number): LiveCheck => {
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const now = useSecondClock();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch(ROUTES.api.status, { cache: "no-store" });
        const body = (await response.json()) as StatusResponse;
        if (cancelled) {
          return;
        }
        if (body.ok && !body.data.maintenance) {
          window.location.replace(ROUTES.home);
          return;
        }
      } catch {
        // Network blip: keep the page up and try again on the next tick.
      }
      if (!cancelled) {
        setLastCheckedAt(Date.now());
      }
    };

    void check();
    const timer = setInterval(() => void check(), intervalSeconds * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [intervalSeconds]);

  const elapsedSeconds = lastCheckedAt !== null && now !== null ? Math.max(0, (now - lastCheckedAt) / 1000) : 0;
  const secondsToNext = Math.max(0, Math.ceil(intervalSeconds - elapsedSeconds));
  return { lastCheckedAt, secondsToNext, progress: Math.min(1, elapsedSeconds / intervalSeconds) };
};
