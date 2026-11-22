"use client";

import { motion, type TargetAndTransition } from "motion/react";
import type { FC } from "react";
import { CHECK_PATH, X_STROKE_A, X_STROKE_B, circlePath, pick } from "./geometry";
import { useIconContext } from "./icon-context";
import { InkPath } from "./ink-path";
import type { IconName } from "./types";
import { useOrbit } from "./use-orbit";

type StateVariants = { idle: TargetAndTransition } & Partial<Record<string, TargetAndTransition>>;

/** Navigation / external link: the arrow retracts, launches across a registration mark, and stamps on press. */
const ArrowUpRight: FC = () => {
  const { state } = useIconContext();
  const aiming = state === "hover" || state === "active";
  const arrow: StateVariants = {
    idle: { x: 0, y: 0, scale: 1 },
    hover: { x: [0, -1.5, 2], y: [0, 1.5, -2], transition: { duration: 0.42, times: [0, 0.35, 1] } },
    active: { x: 2, y: -2, scale: 0.82 },
  };

  return (
    <>
      <motion.g initial={false} animate={pick(arrow, state)} style={{ originX: 0.5, originY: 0.5 }}>
        <InkPath d="M7 17L17 7" order={0} />
        <InkPath d="M9 7L17 7L17 15" order={1} />
      </motion.g>
      <InkPath d={circlePath(19, 5, 2.5)} drawn={aiming} strokeWidth={1} />
      <InkPath d="M15.5 5L22.5 5" drawn={aiming} strokeWidth={1} />
      <InkPath d="M19 1.5L19 8.5" drawn={aiming} strokeWidth={1} />
    </>
  );
};

/** Auth: the shackle lifts and swings open on success; the parent shakes and turns the error colour on failure. */
const Lock: FC = () => {
  const { state } = useIconContext();
  const shackle: StateVariants = {
    idle: { y: 0, rotate: 0 },
    hover: { y: -1, rotate: 0 },
    active: { y: 0.5, rotate: 0 },
    loading: { y: [0, -1, 0], rotate: 0, transition: { duration: 0.8, repeat: Infinity } },
    success: { y: -2.5, rotate: 22 },
  };

  return (
    <>
      {/* Pivot on the right leg so the left leg lifts out of the body. */}
      <motion.g initial={false} animate={pick(shackle, state)} style={{ originX: 1, originY: 1 }}>
        <InkPath d="M8 11L8 7.5A4 4 0 0 1 16 7.5L16 11" order={1} />
      </motion.g>
      <InkPath d="M5 11L19 11L19 21L5 21L5 11" order={0} />
      <InkPath d="M12 15L12 17.5" order={2} />
    </>
  );
};

/** Copy / export: layers separate in depth, then morph into a hand-drawn check and settle back. */
const Copy: FC = () => {
  const { state } = useIconContext();
  const lifted = state === "hover" || state === "active";
  const copied = state === "success";

  return (
    <>
      <motion.g initial={false} animate={{ x: lifted ? -1.2 : 0, y: lifted ? -1.2 : 0 }}>
        <InkPath d="M6 15L4 15L4 4L15 4L15 6" drawn={!copied} order={0} />
      </motion.g>
      <motion.g initial={false} animate={{ x: lifted ? 1 : 0, y: lifted ? 1 : 0, scale: lifted ? 1.04 : 1 }}>
        <InkPath d="M9 9L20 9L20 20L9 20L9 9" drawn={!copied} order={1} />
      </motion.g>
      <InkPath d={CHECK_PATH} drawn={copied} />
    </>
  );
};

/** Menu / drawer: asymmetric editorial rules morph into the poster's hand-drawn X. */
const Menu: FC = () => {
  const { state } = useIconContext();
  const open = state === "active";
  const leaning = state === "hover";

  return (
    <>
      <InkPath d={open ? "M5.2 5.6L18.8 18.2" : leaning ? "M3 7L19 7" : "M3 7L21 7"} order={0} />
      <InkPath d={open ? "M12 12L12 12" : leaning ? "M3 12L18 12" : "M3 12L14 12"} drawn={!open} order={1} />
      <InkPath d={open ? "M5.6 18.8L18.4 5.4" : leaning ? "M3 17L21 17" : "M3 17L17 17"} order={2} />
    </>
  );
};

/** Sync / database: a registration mark orbits while loading and decelerates into a locked quarter turn on success. */
const Sync: FC = () => {
  const { state } = useIconContext();
  const rotate = useOrbit(state === "loading", true);
  const locked = state === "success";

  return (
    <>
      <motion.g style={{ rotate, originX: 0.5, originY: 0.5 }}>
        <InkPath d={circlePath(12, 12, 7)} order={0} />
        <InkPath d="M12 2L12 6.5" order={1} />
        <InkPath d="M22 12L17.5 12" order={2} />
        <InkPath d="M12 22L12 17.5" order={3} />
        <InkPath d="M2 12L6.5 12" order={4} />
      </motion.g>
      <motion.circle
        cx={12}
        cy={12}
        r={2}
        fill="currentColor"
        stroke="none"
        initial={false}
        animate={{ scale: locked ? 1 : 0, opacity: locked ? 1 : 0 }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
    </>
  );
};

/** Action status (used inside ActionButton): orbiting arc -> check on success, X on error. Draws nothing at idle. */
const Status: FC = () => {
  const { state } = useIconContext();
  const loading = state === "loading";
  const rotate = useOrbit(loading, false);

  return (
    <>
      <motion.g style={{ rotate, originX: 0.5, originY: 0.5 }}>
        <InkPath d="M12 4A8 8 0 1 1 4 12" drawn={loading} />
        <InkPath d="M12 1.5L12 6" drawn={loading} strokeWidth={1} />
      </motion.g>
      <InkPath d={CHECK_PATH} drawn={state === "success"} />
      <InkPath d={X_STROKE_A} drawn={state === "error"} order={0} />
      <InkPath d={X_STROKE_B} drawn={state === "error"} order={1} />
    </>
  );
};

export const ICONS: Record<IconName, FC> = {
  "arrow-up-right": ArrowUpRight,
  lock: Lock,
  copy: Copy,
  menu: Menu,
  sync: Sync,
  status: Status,
};
