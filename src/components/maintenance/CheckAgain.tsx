"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { useSharedLiveCheck } from "./LiveCheckProvider";

type CheckAgainProps = {
  label: string;
  hint: MaintenanceContent["liveCheck"]["hint"];
};

/**
 * Primary action: check the maintenance flag right now. The sync icon orbits
 * while checking and locks on success; if maintenance is already off, the
 * visitor is sent to the site.
 */
export const CheckAgain = ({ label, hint }: CheckAgainProps) => {
  const { checkNow } = useSharedLiveCheck();
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      <ActionButton method="async-fetch" tone="solid" icon="sync" onAction={checkNow}>
        {label}
      </ActionButton>
      {/* flex-1 + basis lets the hint sit beside the button instead of wrapping under it. */}
      <p className="max-w-[34ch] min-w-0 flex-1 basis-56 text-body leading-snug text-graphite max-lg:[@media(max-height:720px)]:hidden">
        {hint}
      </p>
    </div>
  );
};
