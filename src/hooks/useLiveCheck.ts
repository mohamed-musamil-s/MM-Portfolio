"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionError } from "@/lib/motion/action-machine";
import { ROUTES } from "@/lib/shared/routes";
import { useSecondClock } from "./useSecondClock";

type StatusResponse = { ok: true; data: { maintenance: boolean } } | { ok: false };

export type LiveCheck = {
  /** When the last successful check finished (ms), or null before the first one. */
  lastCheckedAt: number | null;
  /** Whole seconds until the next automatic check. */
  secondsToNext: number;
  /** 0..1 through the current interval. */
  progress: number;
  /** True while a request to /api/status is in flight (automatic or manual). */
  checking: boolean;
  /** Check right now (e.g. a "Check again" button). Restarts the interval. Rejects on failure. */
  checkNow: () => Promise<void>;
};

/**
 * Polls /api/status on load and then every `intervalSeconds`. As soon as the
 * admin switches maintenance off, it sends the visitor to the site; while it
 * stays on, it records the check time. A manual `checkNow` resets the timer.
 */
export const useLiveCheck = (intervalSeconds: number, { enabled = true }: { enabled?: boolean } = {}): LiveCheck => {
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const now = useSecondClock();
  const checkRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      clearTimeout(timer);
      setChecking(true);
      try {
        const response = await fetch(ROUTES.api.status, { cache: "no-store" });
        if (!response.ok) {
          throw new ActionError("Status check failed", response.status);
        }
        const body = (await response.json()) as StatusResponse;
        if (cancelled) {
          return;
        }
        if (body.ok && !body.data.maintenance) {
          window.location.replace(ROUTES.home);
          return;
        }
        setLastCheckedAt(Date.now());
      } finally {
        if (!cancelled) {
          setChecking(false);
          timer = setTimeout(() => void check().catch(() => undefined), intervalSeconds * 1000);
        }
      }
    };

    checkRef.current = check;
    // A failed automatic check just waits for the next tick.
    void check().catch(() => undefined);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, intervalSeconds]);

  const checkNow = useCallback(() => checkRef.current(), []);
  const elapsedSeconds = lastCheckedAt !== null && now !== null ? Math.max(0, (now - lastCheckedAt) / 1000) : 0;
  const secondsToNext = Math.max(0, Math.ceil(intervalSeconds - elapsedSeconds));

  return { lastCheckedAt, checking, secondsToNext, progress: Math.min(1, elapsedSeconds / intervalSeconds), checkNow };
};
