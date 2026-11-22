import "server-only";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/shared/routes";
import { getLogger } from "../logger";
import { getCurrentSession, type StudioSession } from "./session";

const log = getLogger("auth");

/**
 * Server guard for every protected /studio page. The proxy already bounced
 * requests without a validly signed cookie; this is the authoritative check
 * against MongoDB, so revoked sessions are rejected too.
 */
export const requireSession = async (pathname: string): Promise<StudioSession> => {
  const session = await getCurrentSession();
  if (!session) {
    log.info({ path: pathname }, "studio access denied by server guard");
    redirect(`${ROUTES.studio.login}?next=${encodeURIComponent(pathname)}`);
  }
  return session;
};
