"use client";

import { usePathname } from "next/navigation";
import type { StudioModule } from "@/lib/shared/content/studio-shell-schema";
import { moduleForPath } from "./nav";

/** The studio module for the current URL, or null outside the module routes. */
export const useActiveModule = (): StudioModule | null => moduleForPath(usePathname());
