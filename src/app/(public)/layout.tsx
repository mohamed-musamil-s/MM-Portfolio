import { PublicShell } from "@/components/public/PublicShell";
import { SplashGate } from "@/components/splash/SplashGate";
import { getScreenContent } from "@/lib/server/content/screens";

/** The splash never blocks a page: missing or invalid content just means no splash (already logged). */
const readSplash = () => getScreenContent("splash").catch(() => null);

/**
 * All public routes share the editorial surface (docs/STYLE.md). /studio never renders inside it.
 * The name splash plays over the home page on every visit (docs/screens/SPLASH_BUSINESS.md).
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell>
      {children}
      <SplashGate content={await readSplash()} />
    </PublicShell>
  );
}
