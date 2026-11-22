"use client";

import { createContext, use, type ReactNode } from "react";
import { useLiveCheck, type LiveCheck } from "@/hooks/useLiveCheck";

/** The page asks /api/status once a minute whether maintenance is still on. */
export const CHECK_INTERVAL_SECONDS = 60;

const LiveCheckContext = createContext<LiveCheck | null>(null);

/** One shared live check for the whole screen (footer readout + "Check again" button). */
export const LiveCheckProvider = ({ children }: { children: ReactNode }) => (
  <LiveCheckContext value={useLiveCheck(CHECK_INTERVAL_SECONDS)}>{children}</LiveCheckContext>
);

export const useSharedLiveCheck = (): LiveCheck => {
  const value = use(LiveCheckContext);
  if (!value) {
    throw new Error("useSharedLiveCheck must be used inside <LiveCheckProvider>.");
  }
  return value;
};
