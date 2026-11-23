import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/**
 * Signed-in owner in the topbar: initials avatar with an online dot, name and
 * role. Static (no looping motion); on phones only the avatar shows and the
 * name stays available to assistive tech.
 */
export const OwnerChip = ({ owner }: { owner: StudioShellContent["owner"] }) => (
  <div className="flex items-center gap-3">
    <span aria-hidden className="relative grid size-10 place-items-center">
      <span className="grid size-10 place-items-center rounded-full bg-linear-to-br from-foreground to-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20">
        {initials(owner.name)}
      </span>
      <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[2.5px] border-card bg-success" />
    </span>
    <span className="hidden flex-col leading-tight sm:flex">
      <span className="text-sm font-semibold text-foreground">{owner.name}</span>
      <span className="text-xs text-muted-foreground">{owner.role}</span>
    </span>
    <span className="sr-only sm:hidden">{owner.name}</span>
  </div>
);
