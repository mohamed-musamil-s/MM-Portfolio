"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { SIDEBAR_COLLAPSED, SIDEBAR_COOKIE, SIDEBAR_EXPANDED } from "@/lib/shared/studio-sidebar";

type SidebarState = {
  /** Desktop: icon-only rail. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile: the navigation drawer. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarState | null>(null);
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Sidebar state for the studio shell. The collapsed flag starts from the
 * server-read cookie, is written back on every change, and toggles with
 * Ctrl/⌘ + B.
 */
export const SidebarStateProvider = ({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: ReactNode;
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed((value) => !value), []);

  useEffect(() => {
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}; path=/studio; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, [collapsed]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleCollapsed]);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }),
    [collapsed, toggleCollapsed, mobileOpen],
  );
  return <SidebarContext value={value}>{children}</SidebarContext>;
};

export const useSidebarState = (): SidebarState => {
  const value = use(SidebarContext);
  if (!value) {
    throw new Error("useSidebarState must be used inside <SidebarStateProvider>.");
  }
  return value;
};
