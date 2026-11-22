"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, type ReactNode } from "react";
import { useRedirectCountdown, type RedirectCountdown } from "@/hooks/useRedirectCountdown";
import { ROUTES } from "@/lib/shared/routes";

const RedirectContext = createContext<RedirectCountdown | null>(null);

/** One countdown for the whole 404 screen (ring, label, pause button, progress line). */
export const RedirectProvider = ({ seconds, children }: { seconds: number; children: ReactNode }) => {
  const router = useRouter();
  const goHome = useCallback(() => router.replace(ROUTES.home), [router]);
  return <RedirectContext value={useRedirectCountdown(seconds, goHome)}>{children}</RedirectContext>;
};

export const useRedirect = (): RedirectCountdown => {
  const value = use(RedirectContext);
  if (!value) {
    throw new Error("useRedirect must be used inside <RedirectProvider>.");
  }
  return value;
};
