"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

type HoldOptions = {
  enabled: boolean;
  holdMs: number;
  onArm: () => void;
  onDisarm: () => void;
  onConfirm: () => void;
};

const isActivationKey = (key: string) => key === " " || key === "Enter";

/**
 * Press-and-hold gesture for destructive actions, by pointer or keyboard
 * (hold Space/Enter). Releasing early cancels. The timer decides; the fill
 * animation only visualises it.
 */
export const useHoldToConfirm = ({ enabled, holdMs, onArm, onDisarm, onConfirm }: HoldOptions) => {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const holding = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = useCallback(() => {
    if (!enabled || holding.current) {
      return;
    }
    holding.current = true;
    onArm();
    timer.current = setTimeout(() => {
      holding.current = false;
      onConfirm();
    }, holdMs);
  }, [enabled, holdMs, onArm, onConfirm]);

  const cancel = useCallback(() => {
    if (!holding.current) {
      return;
    }
    holding.current = false;
    clearTimeout(timer.current);
    onDisarm();
  }, [onDisarm]);

  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.button === 0) {
        start();
      }
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onKeyDown: (event: KeyboardEvent) => {
      if (isActivationKey(event.key)) {
        event.preventDefault();
        if (!event.repeat) {
          start();
        }
      }
    },
    onKeyUp: (event: KeyboardEvent) => {
      if (isActivationKey(event.key)) {
        cancel();
      }
    },
  };
};
