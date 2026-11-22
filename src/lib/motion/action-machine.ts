/**
 * Pure state machine shared by every action-aware control (ActionButton,
 * MagicIcon status states). No React here, so it is trivially testable.
 *
 *   idle ──ARM──▶ arming ──DISARM──▶ idle
 *    │              │
 *    └──START──▶ loading ◀──START── (arming, error)
 *                   │
 *          RESOLVE ─┴─ REJECT
 *             ▼          ▼
 *          success     error ──RESET──▶ idle
 */

export type ActionStatus = "idle" | "arming" | "loading" | "success" | "error";

export type ActionState = {
  status: ActionStatus;
  /** HTTP status or short code shown in the error badge, e.g. 401. */
  errorCode?: number | string;
};

export type ActionEvent =
  | { type: "ARM" }
  | { type: "DISARM" }
  | { type: "START" }
  | { type: "RESOLVE" }
  | { type: "REJECT"; code?: number | string }
  | { type: "RESET" };

export const INITIAL_ACTION_STATE: ActionState = { status: "idle" };

export const actionReducer = (state: ActionState, event: ActionEvent): ActionState => {
  switch (event.type) {
    case "ARM":
      return state.status === "idle" ? { status: "arming" } : state;
    case "DISARM":
      return state.status === "arming" ? { status: "idle" } : state;
    case "START":
      // loading and success ignore START: this is the double-submit lock.
      return state.status === "idle" || state.status === "arming" || state.status === "error"
        ? { status: "loading" }
        : state;
    case "RESOLVE":
      return state.status === "loading" ? { status: "success" } : state;
    case "REJECT":
      return state.status === "loading" ? { status: "error", errorCode: event.code } : state;
    case "RESET":
      return state.status === "success" || state.status === "error" ? INITIAL_ACTION_STATE : state;
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
};

/** Thrown (or returned as a failed Response) by an action to report a coded failure. */
export class ActionError extends Error {
  constructor(
    message: string,
    readonly code?: number | string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * Normalizes an action's outcome. A non-OK `Response` counts as a failure with
 * its HTTP status, so `onAction={() => fetch(...)}` works directly.
 */
export const failureCode = (outcome: unknown): number | string | undefined => {
  if (outcome instanceof Response && !outcome.ok) {
    return outcome.status;
  }
  return undefined;
};

export const errorCodeOf = (error: unknown): number | string | undefined =>
  error instanceof ActionError ? error.code : undefined;
