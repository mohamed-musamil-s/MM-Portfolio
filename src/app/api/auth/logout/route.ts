import { destroyCurrentSession } from "@/lib/server/auth/session";
import { ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { ROUTES } from "@/lib/shared/routes";

/** Ends the session. Cross-origin calls are refused by withApi (403). */
export const POST = withApi(async () => {
  await destroyCurrentSession();
  return ok({ redirectTo: ROUTES.studio.login });
});
