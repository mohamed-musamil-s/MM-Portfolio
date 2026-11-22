"use client";

import { createContext } from "react";
import type { MotionTheme, ThemeMotion } from "./tokens";

export type MotionContextValue = {
  theme: MotionTheme;
  tokens: ThemeMotion;
  /** True when the user asked the OS for reduced motion. */
  reducedMotion: boolean;
};

export const MotionContext = createContext<MotionContextValue | null>(null);
