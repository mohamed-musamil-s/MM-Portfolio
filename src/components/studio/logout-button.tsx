"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/shared/routes";

export const LogoutButton = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    await fetch(ROUTES.api.logout, { method: "POST" }).catch(() => undefined);
    router.replace(ROUTES.studio.login);
    router.refresh();
  };

  return (
    <button type="button" onClick={handleLogout} disabled={pending}>
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
};
