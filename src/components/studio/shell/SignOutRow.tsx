"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/shared/routes";
import { NavRow } from "./NavRow";

type SignOutRowProps = { label: string; pendingLabel: string; collapsed: boolean };

/** Ends the session (POST /api/auth/logout) and returns to the login screen. */
export const SignOutRow = ({ label, pendingLabel, collapsed }: SignOutRowProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

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
      onSelect={signOut}
      disabled={pending}
      tone="danger"
    />
  );
};
