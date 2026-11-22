import type { ReactNode } from "react";
import type { ActionStatus } from "@/lib/motion/action-machine";
import type { IconName } from "../magic-icon/types";

/**
 * What the button does. Each method has its own choreography:
 * - submit       (POST)   progress fill, then lock-in confirmation
 * - async-fetch  (GET)    inline status icon: orbit -> check / X
 * - navigate     (link)   directional momentum, arrow launch
 * - destructive  (DELETE) press-and-hold to arm, then fires
 * - copy                  copy icon morphs into a check
 * - toggle                aria-pressed on/off (e.g. menu -> X)
 */
export type ActionMethod = "submit" | "async-fetch" | "navigate" | "destructive" | "copy" | "toggle";

/** Visual language. Defaults from the MotionProvider theme. */
export type ActionButtonVariant = "editorial-ink" | "studio-action";

/** Emphasis. `solid` is a filled pill for the single primary action on a screen. */
export type ActionButtonTone = "outline" | "solid";

type CommonProps = {
  children: ReactNode;
  variant?: ActionButtonVariant;
  tone?: ActionButtonTone;
  /** Leading icon. When set, it also reflects loading / success / error. */
  icon?: IconName;
  disabled?: boolean;
  className?: string;
  /** Controlled status, e.g. a form's pending state. Overrides internal state. */
  status?: ActionStatus;
  /** Error badge text when `status` is controlled. */
  errorCode?: number | string;
};

/** An action may return a Response (non-OK = error with its HTTP status) or throw an ActionError. */
export type ActionHandler = () => unknown;

export type SubmitProps = CommonProps & {
  method: "submit";
  /** Omit to let a surrounding <form> handle the submit (pair with `status`). */
  onAction?: ActionHandler;
};

export type AsyncFetchProps = CommonProps & { method: "async-fetch"; onAction: ActionHandler };

export type NavigateProps = CommonProps & { method: "navigate"; href: string; external?: boolean };

export type DestructiveProps = CommonProps & {
  method: "destructive";
  onAction: ActionHandler;
  /** How long the press must be held before the action fires. */
  holdMs?: number;
};

export type CopyProps = CommonProps & { method: "copy"; copyText: string };

export type ToggleProps = CommonProps & {
  method: "toggle";
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

export type ActionButtonProps =
  | SubmitProps
  | AsyncFetchProps
  | NavigateProps
  | DestructiveProps
  | CopyProps
  | ToggleProps;
