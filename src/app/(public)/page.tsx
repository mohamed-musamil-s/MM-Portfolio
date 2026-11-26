import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { Education } from "@/components/home/Education";
import { Experience } from "@/components/home/Experience";
import { Hero } from "@/components/home/Hero";
import { Recognition } from "@/components/home/Recognition";
import { SiteFooter } from "@/components/home/SiteFooter";
import { Skills } from "@/components/home/Skills";
import { Work } from "@/components/home/Work";
import { SiteNav } from "@/components/home/SiteNav";
import { ReplaceRoute } from "@/components/public/ReplaceRoute";
import { getScreenContent } from "@/lib/server/content/screens";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { getSectionVisibility } from "@/lib/server/settings/section-visibility";
import { linkIsShown } from "@/lib/shared/content/home-sections";
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
  const [home, { visible }] = await Promise.all([readHome(), getSectionVisibility()]);
  if (!home) {
    notFound();
  }
  // Sections hidden from Launchpad leave the page, and so do their navbar and footer links.
  const nav = { ...home.nav, links: home.nav.links.filter((link) => linkIsShown(link.href, visible)) };
  const footer = { ...home.footer, links: home.footer.links.filter((link) => linkIsShown(link.href, visible)) };
  return (
    <>
      <SiteNav nav={nav} />
      {/* Above the footer, which sits fixed underneath and is uncovered as the page lifts off it. */}
      <main
        id="top"
        className="relative z-10 overflow-clip rounded-b-[2.5rem] bg-paper shadow-[0_40px_80px_-30px_rgb(0_0_0/0.5)]"
      >
        <Hero hero={home.hero} />
        {visible.about ? <About about={home.about} /> : null}
        {visible.experience ? <Experience experience={home.experience} /> : null}
        {visible.education ? <Education education={home.education} /> : null}
        {visible.skills ? <Skills skills={home.skills} /> : null}
        {visible.work ? <Work work={home.work} /> : null}
        {visible.recognition ? <Recognition recognition={home.recognition} /> : null}
        {visible.contact ? <Contact contact={home.contact} owner={home.nav.name} /> : null}
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
