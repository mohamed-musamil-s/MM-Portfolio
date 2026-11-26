/**
 * The portfolio sections that can be shown or hidden from Launchpad
 * (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md), in page order. Each one's key
 * is also its anchor id on the page (`#about`). The hero and footer always show.
 */
export const HOME_SECTIONS = ["about", "experience", "education", "skills", "work", "recognition", "contact"] as const;

export type HomeSection = (typeof HOME_SECTIONS)[number];

export type SectionVisibility = Record<HomeSection, boolean>;

/** Everything shows until an admin hides it. */
export const ALL_VISIBLE: SectionVisibility = Object.fromEntries(
  HOME_SECTIONS.map((section) => [section, true]),
) as SectionVisibility;

export const isHomeSection = (value: string): value is HomeSection =>
  (HOME_SECTIONS as readonly string[]).includes(value);

/** False for a `#section` link whose section is hidden; every other link stays. */
export const linkIsShown = (href: string, visible: SectionVisibility): boolean => {
  const anchor = href.startsWith("#") ? href.slice(1) : "";
  return isHomeSection(anchor) ? visible[anchor] : true;
};
