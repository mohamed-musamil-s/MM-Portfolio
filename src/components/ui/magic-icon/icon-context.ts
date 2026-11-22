"use client";

import { createContext, use } from "react";
import type { IconState } from "./types";

export type IconContextValue = {
  state: IconState;
  drawOnMount: boolean;
};

export const IconContext = createContext<IconContextValue>({ state: "idle", drawOnMount: false });

export const useIconContext = (): IconContextValue => use(IconContext);
