"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
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
  /** The public site's maintenance flag, for the sidebar status card. */
  maintenance: boolean;
  children: ReactNode;
};

/**
 * Frame for every signed-in studio page (docs/components/STUDIO_SHELL_BUSINESS.md):
 * flush full-height sidebar and full-width topbar over a static porcelain
 * canvas, the page in the main slot. Motion happens only on first load and
 * when you act: the page slides in after each navigation you trigger.
 */
export const StudioShell = ({ content, initialCollapsed, maintenance, children }: StudioShellProps) => {
  const pathname = usePathname();
  return (
    <TooltipProvider delayDuration={200}>
      <SidebarStateProvider initialCollapsed={initialCollapsed}>
        <ShellBackdrop />
        {/* A fixed 100vh frame: sidebar and topbar stay put, only the page area scrolls. */}
        <div className="flex h-svh overflow-hidden">
          <StudioSidebar content={content} maintenance={maintenance} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <StudioTopbar content={content} />
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div
                key={pathname}
                className="flex min-h-0 flex-1 animate-in flex-col duration-500 ease-out fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
              >
                {children}
              </div>
            </main>
          </div>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border-border !bg-card !text-foreground !shadow-xl !font-ui",
              description: "!text-muted-foreground",
            },
          }}
        />
      </SidebarStateProvider>
    </TooltipProvider>
  );
};
