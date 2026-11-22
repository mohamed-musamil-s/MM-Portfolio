"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/studio/ui/tooltip";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { SidebarStateProvider } from "./sidebar-state";
import { StudioSidebar } from "./StudioSidebar";
import { StudioTopbar } from "./StudioTopbar";

type StudioShellProps = {
  content: StudioShellContent;
  /** From the studio_sidebar cookie, so the server render matches. */
  initialCollapsed: boolean;
  children: ReactNode;
};

/**
 * Frame for every signed-in studio page (docs/components/STUDIO_SHELL_BUSINESS.md):
 * sidebar + sticky topbar, the page in the main slot. The page fades up a
 * few pixels on each navigation.
 */
export const StudioShell = ({ content, initialCollapsed, children }: StudioShellProps) => {
  const pathname = usePathname();
  return (
    <TooltipProvider delayDuration={150}>
      <SidebarStateProvider initialCollapsed={initialCollapsed}>
        <div className="flex min-h-svh bg-background">
          <StudioSidebar content={content} />
          <div className="flex min-w-0 flex-1 flex-col">
            <StudioTopbar content={content} />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </SidebarStateProvider>
    </TooltipProvider>
  );
};
