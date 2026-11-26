import { PublicShell } from "@/components/public/PublicShell";
import { SiteAnalytics } from "@/components/public/SiteAnalytics";
import { SplashGate } from "@/components/splash/SplashGate";
import { getScreenContent } from "@/lib/server/content/screens";

/** The splash never blocks a page: missing or invalid content just means no splash (already logged). */
const readSplash = () => getScreenContent("splash").catch(() => null);

/**
 * All public routes share the editorial surface (docs/STYLE.md). /studio never renders inside it.
 * The name splash plays over the home page on every visit (docs/screens/SPLASH_BUSINESS.md).
 * Vercel Web Analytics counts visits here only, never in the studio (docs/screens/STUDIO_PULSE_BUSINESS.md);
 * local development sends nothing.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell>
      {children}
      <SplashGate content={await readSplash()} />
      <SiteAnalytics />
    </PublicShell>
  );
}
