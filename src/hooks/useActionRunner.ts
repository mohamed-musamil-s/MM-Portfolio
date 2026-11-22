"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  INITIAL_ACTION_STATE,
  actionReducer,
  errorCodeOf,
  failureCode,
  type ActionState,
} from "@/lib/motion/action-machine";
import { useMotionTheme } from "./useMotionTheme";

type ActionRunner = {
  state: ActionState;
  /** Runs an async action through loading -> success | error, then resets to idle. */
  run: (action: () => unknown) => Promise<void>;
  arm: () => void;
  disarm: () => void;
};

/**
 * Drives the shared action state machine. Guarantees one in-flight action at a
 * time (double-submit lock) and auto-resets after the theme's hold duration.
 */
export const useActionRunner = (): ActionRunner => {
  const { tokens } = useMotionTheme();
  const [state, dispatch] = useReducer(actionReducer, INITIAL_ACTION_STATE);
  const busy = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const scheduleReset = useCallback((delayMs: number) => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => dispatch({ type: "RESET" }), delayMs);
  }, []);

  const run = useCallback(
    async (action: () => unknown) => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      clearTimeout(resetTimer.current);
      dispatch({ type: "START" });

      try {
        const code = failureCode(await action());
        if (code === undefined) {
          dispatch({ type: "RESOLVE" });
          scheduleReset(tokens.statusHoldMs.success);
        } else {
          dispatch({ type: "REJECT", code });
          scheduleReset(tokens.statusHoldMs.error);
        }
      } catch (error) {
        dispatch({ type: "REJECT", code: errorCodeOf(error) });
        scheduleReset(tokens.statusHoldMs.error);
      } finally {
        busy.current = false;
      }
    },
    [scheduleReset, tokens.statusHoldMs],
  );

  const arm = useCallback(() => dispatch({ type: "ARM" }), []);
  const disarm = useCallback(() => dispatch({ type: "DISARM" }), []);

  return { state, run, arm, disarm };
};
