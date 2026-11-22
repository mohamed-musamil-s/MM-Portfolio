import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { cn } from "@/lib/shared/cn";
import { BodyScope } from "./BodyScope";

// Self-hosted by next/font; globals.css maps it to `font-ui` on the studio surface.
const inter = Inter({ subsets: ["latin"], variable: "--font-studio-inter", display: "swap" });

/**
 * Root of every /studio page (docs/ADMIN_STYLE.md §1): activates the studio
 * token surface (light, or dark from the OS setting), loads Inter and runs the
 * snappy `studio` motion theme. Nothing from the public surface is used here.
 */
export const StudioShell = ({ children }: { children: ReactNode }) => (
  <div data-surface="studio" className={cn(inter.variable, "min-h-svh font-ui antialiased")}>
    <BodyScope surface="studio" className={inter.variable} />
    <MotionProvider theme="studio">{children}</MotionProvider>
  </div>
);
