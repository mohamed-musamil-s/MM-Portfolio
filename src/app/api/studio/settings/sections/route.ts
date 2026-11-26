import { z } from "zod";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withStudioApi } from "@/lib/server/http/with-api";
import { getSectionVisibility, setSectionVisibility } from "@/lib/server/settings/section-visibility";
import { HOME_SECTIONS } from "@/lib/shared/content/home-sections";

/**
 * Launchpad's section switches (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md).
 *   GET  -> { visible, updatedAt, updatedBy }
 *   PUT  <- { visible: { <section>: boolean } }   (any subset)
 * Both need an admin session (401); PUT is same-origin JSON only (withApi).
 */

const putBody = z.object({
  visible: z
    .partialRecord(z.enum(HOME_SECTIONS), z.boolean())
    .refine((value) => Object.keys(value).length > 0, "Nothing to change."),
});

export const GET = withStudioApi(async () => ok(await getSectionVisibility()));

export const PUT = withStudioApi(async (request, { session }) => {
  const body = putBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Expected { visible: { <section>: boolean } }.");
  }
  const visible = await setSectionVisibility(body.data.visible, session.email);
  return ok({ visible });
});
