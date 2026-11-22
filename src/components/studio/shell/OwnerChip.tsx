import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/** Signed-in owner in the topbar: initials avatar, name and role (name only for assistive tech on phones). */
export const OwnerChip = ({ owner }: { owner: StudioShellContent["owner"] }) => (
  <div className="flex items-center gap-3">
    <span className="hidden flex-col items-end leading-tight sm:flex">
      <span className="text-sm font-medium text-foreground">{owner.name}</span>
      <span className="text-xs text-muted-foreground">{owner.role}</span>
    </span>
    <span className="sr-only sm:hidden">{owner.name}</span>
    <span
      aria-hidden
      className="grid size-9 place-items-center rounded-full bg-linear-to-br from-primary to-aurora-indigo text-xs font-semibold text-primary-foreground shadow-sm ring-2 ring-card"
    >
      {initials(owner.name)}
    </span>
  </div>
);
