import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { Experience } from "@/components/home/Experience";
import { Hero } from "@/components/home/Hero";
import { Recognition } from "@/components/home/Recognition";
import { SiteFooter } from "@/components/home/SiteFooter";
import { Skills } from "@/components/home/Skills";
import { Work } from "@/components/home/Work";
import { Sheet } from "@/components/home/Sheet";
import { SiteNav } from "@/components/home/SiteNav";
import { ReplaceRoute } from "@/components/public/ReplaceRoute";
import { getScreenContent } from "@/lib/server/content/screens";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { ROUTES } from "@/lib/shared/routes";

// Content and the maintenance flag change at any time from the studio.
export const dynamic = "force-dynamic";

/** Missing or invalid home content: the 404 screen (already logged), as before the home existed. */
const readHome = () => getScreenContent("home").catch(() => null);

export async function generateMetadata(): Promise<Metadata> {
  const home = await readHome();
  return home ? { title: { absolute: home.meta.title }, description: home.meta.description } : {};
}

/**
 * Home (`/`, docs/screens/HOME_BUSINESS.md). The name splash plays over it on
 * every visit (public layout). While maintenance mode is on, the page moves on
 * to `/maintenance` underneath the splash instead.
 */
export default async function HomePage() {
  if (await isMaintenanceEnabled()) {
    return (
      <main>
        <ReplaceRoute href={ROUTES.maintenance} />
      </main>
    );
  }
  const home = await readHome();
  if (!home) {
    notFound();
  }
  return (
    <>
      <SiteNav nav={home.nav} />
      <main id="top">
        <Hero hero={home.hero} />
        {/* Each section slides up over the last as a sheet (Sheet.tsx). */}
        <Sheet depth={1}>
          <About about={home.about} />
        </Sheet>
        <Sheet depth={2}>
          <Experience experience={home.experience} />
        </Sheet>
        <Sheet depth={3}>
          <Skills skills={home.skills} />
        </Sheet>
        <Sheet depth={4}>
          <Work work={home.work} />
        </Sheet>
        <Sheet depth={5}>
          <Recognition recognition={home.recognition} />
        </Sheet>
        <Sheet depth={6}>
          <Contact contact={home.contact} />
        </Sheet>
      </main>
      <Sheet depth={7}>
        <SiteFooter footer={home.footer} />
      </Sheet>
    </>
  );
}
