"use client";

import { useCallback, useState, type FocusEvent, type MouseEvent } from "react";
import { useActionRunner } from "@/hooks/useActionRunner";
import type { ActionStatus } from "@/lib/motion/action-machine";
import type { IconState } from "../magic-icon/types";
import type { ActionButtonProps } from "./types";
import { useHoldToConfirm } from "./use-hold-to-confirm";

export const DEFAULT_HOLD_MS = 1200;

const iconStateFor = (status: ActionStatus, engaged: boolean, hovering: boolean): IconState => {
  if (status === "loading" || status === "success" || status === "error") {
    return status;
  }
  if (engaged) {
    return "active";
  }
  return hovering ? "hover" : "idle";
};

const liveMessageFor = (props: ActionButtonProps, status: ActionStatus, errorCode?: number | string): string => {
  switch (status) {
    case "arming":
      return "Keep holding to confirm";
    case "loading":
      return "Working";
    case "success":
      return props.method === "copy" ? "Copied" : "Done";
    case "error":
      return errorCode === undefined ? "Failed" : `Failed, ${errorCode}`;
    case "idle":
      return "";
  }
};

/**
 * All behaviour of ActionButton: action state machine, method-specific click
 * handling, hold-to-confirm, toggle state and hover intent. The component
 * itself only renders what this returns.
 */
export const useActionButton = (props: ActionButtonProps) => {
  const runner = useActionRunner();
  const [hovering, setHovering] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [uncontrolledPressed, setUncontrolledPressed] = useState(
    props.method === "toggle" ? (props.defaultPressed ?? false) : false,
  );

  const controlled = props.status !== undefined;
  const status = props.status ?? runner.state.status;
  const errorCode = controlled ? props.errorCode : runner.state.errorCode;
  const pressed = props.method === "toggle" ? (props.pressed ?? uncontrolledPressed) : false;
  const holdMs = props.method === "destructive" ? (props.holdMs ?? DEFAULT_HOLD_MS) : 0;

  const hold = useHoldToConfirm({
    enabled: props.method === "destructive" && !props.disabled && status !== "loading",
    holdMs,
    onArm: runner.arm,
    onDisarm: runner.disarm,
    onConfirm: () => {
      if (props.method === "destructive") {
        void runner.run(props.onAction);
      }
    },
  });

  const handleClick = (event: MouseEvent) => {
    if (props.disabled) {
      event.preventDefault();
      return;
    }
    switch (props.method) {
      case "submit":
        // Without onAction the native submit goes to the surrounding <form>.
        if (props.onAction) {
          void runner.run(props.onAction);
        }
        return;
      case "async-fetch":
        void runner.run(props.onAction);
        return;
      case "copy": {
        const { copyText } = props;
        void runner.run(() => navigator.clipboard.writeText(copyText));
        return;
      }
      case "toggle": {
        const next = !pressed;
        setUncontrolledPressed(next);
        props.onPressedChange?.(next);
        return;
      }
      case "destructive":
        // Fires only through the hold gesture, never on a plain click.
        event.preventDefault();
        return;
      case "navigate":
        return;
    }
  };

  const handleFocus = useCallback((event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.matches(":focus-visible")) {
      setHovering(true);
    }
  }, []);

  const engaged = pressed || pressing || status === "arming";

  return {
    status,
    errorCode,
    pressed,
    hovering,
    holdMs,
    iconState: iconStateFor(status, engaged, hovering),
    liveMessage: liveMessageFor(props, status, errorCode),
    holdHandlers: props.method === "destructive" ? hold : undefined,
    handlers: {
      onClick: handleClick,
      onHoverStart: () => setHovering(true),
      onHoverEnd: () => setHovering(false),
      onTapStart: () => setPressing(true),
      onTap: () => setPressing(false),
      onTapCancel: () => setPressing(false),
      onFocus: handleFocus,
      onBlur: () => setHovering(false),
    },
  };
};
