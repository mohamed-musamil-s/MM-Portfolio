"use client";

import { createContext, use, type ReactNode } from "react";
import { usePreviewMode } from "@/components/public/preview-mode";
import { useLiveCheck, type LiveCheck } from "@/hooks/useLiveCheck";

/** The page asks /api/status once a minute whether maintenance is still on. */
export const CHECK_INTERVAL_SECONDS = 60;

const LiveCheckContext = createContext<LiveCheck | null>(null);

/** One shared live check for the whole screen (footer readout + "Check again" button). */
export const LiveCheckProvider = ({ children }: { children: ReactNode }) => {
  // The studio preview never polls (and so never redirects).
  const live = useLiveCheck(CHECK_INTERVAL_SECONDS, { enabled: !usePreviewMode() });
  return <LiveCheckContext value={live}>{children}</LiveCheckContext>;
};

export const useSharedLiveCheck = (): LiveCheck => {
  const value = use(LiveCheckContext);
  if (!value) {
    throw new Error("useSharedLiveCheck must be used inside <LiveCheckProvider>.");
  }
  return value;
};
