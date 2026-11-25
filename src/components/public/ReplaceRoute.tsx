"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Moves on to `href` as soon as the page mounts, replacing the history entry.
 * Used by the home page while maintenance mode is on: the name splash (in the
 * layout) keeps playing over the top while the maintenance page loads beneath it.
 */
export const ReplaceRoute = ({ href }: { href: string }) => {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [router, href]);
  return null;
};
