import type { Metadata } from "next";
import Link from "next/link";
import { STUDIO_NAV } from "@/lib/shared/routes";
import { LogoutButton } from "@/components/studio/logout-button";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Structure only. Each page calls requireSession(): layouts are not re-run on
// client navigation, so they are not a reliable place for an auth check.
export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <>
      <nav aria-label="Studio">
        <ul>
          {STUDIO_NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <LogoutButton />
      </nav>
      {children}
    </>
  );
}
