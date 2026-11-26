"use client";

import type { HomeContent } from "@/lib/shared/content/home-schema";
import { linkIsShown, type SectionVisibility } from "@/lib/shared/content/home-sections";
import { About } from "./About";
import { Contact } from "./Contact";
import { Education } from "./Education";
import { Experience } from "./Experience";
import { Hero } from "./Hero";
import { Recognition } from "./Recognition";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";
import { Skills } from "./Skills";
import { Work } from "./Work";

/**
 * The whole home page from its content (docs/screens/HOME_BUSINESS.md): the
 * public page and Content Forge's live preview render the same thing.
 * Sections hidden from Launchpad leave the page, and so do their navbar and
 * footer links.
 */
export const HomeView = ({ home, visible }: { home: HomeContent; visible: SectionVisibility }) => {
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
};
