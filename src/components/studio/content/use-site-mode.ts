"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/** The public site's live / maintenance switch (PUT /api/studio/settings/maintenance), with rollback on failure. */
export const useSiteMode = (initial: boolean, messages: { updated: string; failed: string }) => {
  const router = useRouter();
  const [maintenance, setMaintenance] = useState(initial);
  const [pending, setPending] = useState(false);

  const change = async (next: boolean) => {
    setPending(true);
    setMaintenance(next);
    const response = await fetch("/api/studio/settings/maintenance", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    }).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      setMaintenance(!next);
      toast.error(messages.failed);
      return;
    }
    toast.success(messages.updated);
    router.refresh();
  };

  return { maintenance, pending, change };
};
