/*
 * Static light canvas behind the studio shell: porcelain base, a soft cool
 * wash from the top right and a faint dot grid in that corner. No motion:
 * the shell only animates on first load and in response to clicks.
 */
export const ShellBackdrop = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
    <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_oklab,var(--studio-aurora-lavender)_55%,transparent)_0%,transparent_55%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,color-mix(in_oklab,var(--studio-aurora-ice)_60%,transparent)_0%,transparent_60%)]" />
    <div className="absolute top-0 right-0 h-[60vh] w-[60vw] bg-[radial-gradient(var(--studio-aurora-periwinkle)_1px,transparent_1px)] mask-[radial-gradient(closest-side_at_100%_0%,black,transparent)] bg-size-[22px_22px] opacity-35" />
  </div>
);
