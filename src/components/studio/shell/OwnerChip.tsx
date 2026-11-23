"use client";

import { ArrowUpRight, ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/studio/ui/dropdown-menu";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { ROUTES } from "@/lib/shared/routes";

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const Avatar = ({ name, size = "size-8" }: { name: string; size?: string }) => (
  <span aria-hidden className="relative shrink-0">
    <span
      className={cn(
        "grid place-items-center rounded-full bg-linear-to-br from-foreground to-primary text-xs font-semibold text-primary-foreground",
        size,
      )}
    >
      {initials(name)}
    </span>
    <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-success" />
  </span>
);

/**
 * Owner in the topbar as an account menu: avatar, name and role on a button
 * that opens a small menu (who is signed in, view the public site, sign out).
 */
export const OwnerChip = ({ content }: { content: StudioShellContent }) => {
  const { owner, actions, siteStatus } = content;
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await fetch(ROUTES.api.logout, { method: "POST" }).catch(() => undefined);
    router.replace(ROUTES.studio.login);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={actions.accountMenu}
        className="group/account flex items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition-colors duration-200 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-muted"
      >
        <Avatar name={owner.name} />
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-medium text-foreground">{owner.name}</span>
          <span className="text-[0.6875rem] text-muted-foreground">{owner.role}</span>
        </span>
        <ChevronDown
          aria-hidden
          className="hidden size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/account:rotate-180 sm:block"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar name={owner.name} size="size-9" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">{owner.name}</span>
            <span className="truncate text-xs text-muted-foreground">{owner.role}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
          <a href={ROUTES.home} target="_blank" rel="noopener noreferrer">
            <ArrowUpRight aria-hidden />
            {siteStatus.viewSite}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer rounded-lg px-2 py-2"
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          <LogOut aria-hidden />
          {signingOut ? actions.signingOut : actions.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
