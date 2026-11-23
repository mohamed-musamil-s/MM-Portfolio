import type { Metadata } from "next";
import { cookies } from "next/headers";
import { StudioShell } from "@/components/studio/shell/StudioShell";
import { getScreenContent } from "@/lib/server/content/screens";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { SIDEBAR_COLLAPSED, SIDEBAR_COOKIE } from "@/lib/shared/studio-sidebar";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Structure only. Each page calls requireSession(): layouts are not re-run on
// client navigation, so they are not a reliable place for an auth check.
export default async function StudioProtectedLayout({ children }: LayoutProps<"/studio">) {
  const [content, cookieStore, maintenance] = await Promise.all([
    getScreenContent("studio-shell"),
    cookies(),
    isMaintenanceEnabled(),
  ]);
  const initialCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === SIDEBAR_COLLAPSED;

  return (
    <StudioShell content={content} initialCollapsed={initialCollapsed} maintenance={maintenance}>
      {children}
    </StudioShell>
  );
}
