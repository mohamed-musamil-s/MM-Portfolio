import { z } from "zod";
import { getConversation, updateConversation } from "@/lib/server/contact/conversations";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withStudioApi } from "@/lib/server/http/with-api";

/**
 * One contact-form conversation (docs/features/CONTACT_MESSAGES.md):
 *   GET   /api/studio/messages/:id -> Conversation (messages, page, referrer)
 *   PATCH /api/studio/messages/:id <- { unread?, status? }
 * Admin session required; PATCH is same-origin JSON only.
 */

type Route = RouteContext<"/api/studio/messages/[id]">;

const notFound = () => fail(HTTP_STATUS.notFound, "not_found", "No such conversation.");

const patchBody = z
  .object({ unread: z.boolean().optional(), status: z.enum(["open", "archived"]).optional() })
  .refine((body) => body.unread !== undefined || body.status !== undefined, "Nothing to change.");

export const GET = withStudioApi<Route>(async (_request, _api, route) => {
  const { id } = await route.params;
  const conversation = await getConversation(id);
  return conversation ? ok(conversation) : notFound();
});

export const PATCH = withStudioApi<Route>(async (request, { log }, route) => {
  const { id } = await route.params;
  const body = patchBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Expected { unread?, status? }.");
  }
  if (!(await updateConversation(id, body.data))) {
    return notFound();
  }
  log.info({ conversation: id, ...body.data }, "conversation updated");
  return ok({ id, ...body.data });
});
