"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/studio/ui/tooltip";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { ShellBackdrop } from "./ShellBackdrop";
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
 * a floating glass sidebar and topbar over a drifting light canvas, the page
 * in the main slot. Each navigation blurs, fades and slides the page in.
 */
export const StudioShell = ({ content, initialCollapsed, children }: StudioShellProps) => {
  const pathname = usePathname();
  return (
    <TooltipProvider delayDuration={150}>
      <SidebarStateProvider initialCollapsed={initialCollapsed}>
        <ShellBackdrop />
        <div className="flex min-h-svh">
          <StudioSidebar content={content} />
          <div className="flex min-w-0 flex-1 flex-col">
            <StudioTopbar content={content} />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8 lg:pr-8 lg:pl-5">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
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
