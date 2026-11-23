"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ROUTES } from "@/lib/shared/routes";
import { NavRow } from "./NavRow";

type SignOutRowProps = { label: string; pendingLabel: string; collapsed: boolean };

/** Ends the session (POST /api/auth/logout) and returns to the login screen. */
export const SignOutRow = ({ label, pendingLabel, collapsed }: SignOutRowProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverId = `signout-${useId()}`;

  const signOut = async () => {
    setPending(true);
    await fetch(ROUTES.api.logout, { method: "POST" }).catch(() => undefined);
    router.replace(ROUTES.studio.login);
    router.refresh();
  };

  return (
    <NavRow
      label={pending ? pendingLabel : label}
      icon="logout"
      collapsed={collapsed}
      hovered={hovered || pending}
      hoverId={hoverId}
      onHoverChange={setHovered}
      onSelect={signOut}
      disabled={pending}
      tone="danger"
    />
  );
};
