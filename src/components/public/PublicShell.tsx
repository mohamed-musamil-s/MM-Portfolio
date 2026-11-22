import { Inter_Tight, JetBrains_Mono, Permanent_Marker } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { cn } from "@/lib/shared/cn";

// Self-hosted by next/font at build time; exposed as the variables globals.css maps to font-grotesk / font-technical / font-brush.
const grotesk = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const technical = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono", display: "swap" });
const brush = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-permanent-marker", display: "swap" });

/**
 * Root of every public page (docs/STYLE.md §1): activates the public token
 * surface, loads the three public typefaces, runs the portfolio motion theme
 * (Lenis, magnetic, parallax) and lays the static paper grain on top.
 */
export const PublicShell = ({ children }: { children: ReactNode }) => (
  <div
    data-surface="public"
    className={cn(grotesk.variable, technical.variable, brush.variable, "relative min-h-svh antialiased")}
  >
    <MotionProvider theme="portfolio">{children}</MotionProvider>
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 bg-[url(/textures/grain.svg)] bg-size-[256px] opacity-4 mix-blend-multiply print:hidden contrast-more:hidden"
    />
  </div>
);
