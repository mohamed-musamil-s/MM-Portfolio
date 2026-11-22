"use client";

import { use } from "react";
import { MotionContext, type MotionContextValue } from "@/lib/motion/motion-context";

/** Theme, motion tokens and reduced-motion flag from the nearest <MotionProvider>. */
export const useMotionTheme = (): MotionContextValue => {
  const value = use(MotionContext);
  if (!value) {
    throw new Error("useMotionTheme must be used inside <MotionProvider>.");
  }
  return value;
};
