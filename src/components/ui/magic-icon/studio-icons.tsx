"use client";

import { motion } from "motion/react";
import type { FC } from "react";
import { circlePath } from "./geometry";
import { useIconContext } from "./icon-context";
import { InkPath } from "./ink-path";

/*
 * Navigation icons for the studio shell (docs/components/STUDIO_SHELL_BUSINESS.md).
 * Rounded strokes on the 24 grid; each reacts to `hover` and settles into an
 * `active` pose for the current page.
 */

const ROUND = { strokeLinecap: "round", strokeLinejoin: "round" } as const;
const SPRING = { type: "spring", stiffness: 420, damping: 22 } as const;

const useEngaged = () => {
  const { state } = useIconContext();
  return { hover: state === "hover", active: state === "active", engaged: state === "hover" || state === "active" };
};

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** Dashboard: four tiles that spread apart on hover. */
const Dashboard: FC = () => {
  const { engaged } = useEngaged();
  const tiles = [
    { d: roundedRect(4, 4, 7, 7, 1.6), x: -0.8, y: -0.8 },
    { d: roundedRect(13, 4, 7, 7, 1.6), x: 0.8, y: -0.8 },
    { d: roundedRect(4, 13, 7, 7, 1.6), x: -0.8, y: 0.8 },
    { d: roundedRect(13, 13, 7, 7, 1.6), x: 0.8, y: 0.8 },
  ];
  return (
    <>
      {tiles.map((tile, index) => (
        <motion.g
          key={tile.d}
          initial={false}
          animate={{ x: engaged ? tile.x : 0, y: engaged ? tile.y : 0 }}
          transition={SPRING}
        >
          <InkPath d={tile.d} order={index} {...ROUND} />
        </motion.g>
      ))}
    </>
  );
};

/** Release: a version tag that swings from its hole. */
const Release: FC = () => {
  const { engaged } = useEngaged();
  return (
    <motion.g
      initial={false}
      animate={{ rotate: engaged ? -14 : 0 }}
      transition={SPRING}
      style={{ originX: "6px", originY: "6px" }}
    >
      <InkPath
        d="M3.5 4.5V11L12.6 20.1A1.6 1.6 0 0 0 14.9 20.1L20.1 14.9A1.6 1.6 0 0 0 20.1 12.6L11 3.5H4.5A1 1 0 0 0 3.5 4.5Z"
        order={0}
        {...ROUND}
      />
      <InkPath d={circlePath(7.8, 7.8, 1.3)} order={1} {...ROUND} />
    </motion.g>
  );
};

/** Content: a page whose lines lengthen as if being written. */
const Content: FC = () => {
  const { engaged } = useEngaged();
  return (
    <>
      <InkPath d="M14 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V8L14 3Z" order={0} {...ROUND} />
      <InkPath d="M14 3V8H19" order={1} {...ROUND} />
      <InkPath d={engaged ? "M8.5 12.5H15.5" : "M8.5 12.5H12.5"} order={2} {...ROUND} />
      <InkPath d={engaged ? "M8.5 16.5H14" : "M8.5 16.5H15.5"} order={3} {...ROUND} />
    </>
  );
};

/** Resume: a page with a person who looks up on hover. */
const Resume: FC = () => {
  const { engaged } = useEngaged();
  return (
    <>
      <InkPath d={roundedRect(4.5, 3, 15, 18, 2)} order={0} {...ROUND} />
      <motion.g initial={false} animate={{ y: engaged ? -1 : 0 }} transition={SPRING}>
        <InkPath d={circlePath(12, 9.5, 2.3)} order={1} {...ROUND} />
        <InkPath d="M8 16.5C8.6 14.6 10.1 13.6 12 13.6C13.9 13.6 15.4 14.6 16 16.5" order={2} {...ROUND} />
      </motion.g>
    </>
  );
};

/** Chats: a speech bubble whose three dots bounce like someone typing. */
const Chat: FC = () => {
  const { engaged } = useEngaged();
  return (
    <>
      <InkPath
        d="M20 11.5C20 15.6 16.4 18.5 12 18.5C11 18.5 10 18.4 9.1 18.1L5 20L5.9 16.3C4.7 15 4 13.3 4 11.5C4 7.4 7.6 4.5 12 4.5C16.4 4.5 20 7.4 20 11.5Z"
        order={0}
        {...ROUND}
      />
      {[8.6, 12, 15.4].map((cx, index) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={11.5}
          r={0.9}
          fill="currentColor"
          stroke="none"
          initial={false}
          animate={engaged ? { y: [0, -1.6, 0] } : { y: 0 }}
          transition={
            engaged ? { duration: 0.6, repeat: Infinity, delay: index * 0.12, ease: "easeInOut" } : { duration: 0.2 }
          }
        />
      ))}
    </>
  );
};

/** Analytics: three bars that re-rank on hover. */
const Analytics: FC = () => {
  const { engaged } = useEngaged();
  return (
    <>
      <InkPath d="M4 20H20" order={0} {...ROUND} />
      <InkPath d={engaged ? "M7 20V9" : "M7 20V13"} order={1} {...ROUND} strokeWidth={2.2} />
      <InkPath d={engaged ? "M12 20V13" : "M12 20V7"} order={2} {...ROUND} strokeWidth={2.2} />
      <InkPath d={engaged ? "M17 20V5" : "M17 20V10"} order={3} {...ROUND} strokeWidth={2.2} />
    </>
  );
};

/** Sign out: the arrow slides out of the door. */
const Logout: FC = () => {
  const { engaged } = useEngaged();
  return (
    <>
      <InkPath d="M10 4H6A2 2 0 0 0 4 6V18A2 2 0 0 0 6 20H10" order={0} {...ROUND} />
      <motion.g initial={false} animate={{ x: engaged ? 1.6 : 0 }} transition={SPRING}>
        <InkPath d="M10 12H19" order={1} {...ROUND} />
        <InkPath d="M15.5 8.5L19 12L15.5 15.5" order={2} {...ROUND} />
      </motion.g>
    </>
  );
};

/** Sidebar toggle: a panel whose rail opens (active = collapsed, the chevron points out). */
const Panel: FC = () => {
  const { state } = useIconContext();
  const collapsed = state === "active";
  const hover = state === "hover";
  return (
    <>
      <InkPath d={roundedRect(3.5, 4.5, 17, 15, 2.5)} order={0} {...ROUND} />
      <InkPath d={collapsed ? "M8 4.5V19.5" : hover ? "M8.5 4.5V19.5" : "M9.5 4.5V19.5"} order={1} {...ROUND} />
      <InkPath
        d={collapsed ? "M13 9.5L15.5 12L13 14.5" : "M15.5 9.5L13 12L15.5 14.5"}
        drawn={collapsed || hover}
        order={2}
        {...ROUND}
      />
    </>
  );
};

export const STUDIO_ICONS = {
  dashboard: Dashboard,
  release: Release,
  content: Content,
  resume: Resume,
  chat: Chat,
  analytics: Analytics,
  logout: Logout,
  panel: Panel,
} as const;
