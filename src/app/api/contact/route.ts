import { NextResponse } from "next/server";
import { checkContactRate, createConversation, hashClientIp } from "@/lib/server/contact/conversations";
import { getClientIp } from "@/lib/server/http/request";
import { HTTP_STATUS, fail } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { contactSubmissionSchema } from "@/lib/shared/contact/contact-schema";

/**
 * POST /api/contact <- { name, email, topic, message, website, elapsedMs }
 * The portfolio's contact form (docs/features/CONTACT_MESSAGES.md). Public,
 * same-origin JSON only (withApi + proxy). Stores one conversation for the
 * studio's chat module and answers 201 { id }.
 *
 * Abuse handling: a filled honeypot or a form sent faster than a person could
 * gets a fake 201 and is not stored; more than CONTACT_RATE sends per client
 * (hashed IP) or overall per hour gets 429.
 */

const TOO_FAST_MS = 2500;
const TRUNCATE = 300;

/** A believable success for bots, so they learn nothing. */
const fakeSuccess = () => NextResponse.json({ ok: true, data: { id: "0".repeat(24) } }, { status: 201 });

export const POST = withApi(async (request, { log }) => {
  const parsed = contactSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Please check the form and try again.", {
      details: { fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")))] },
    });
  }
  const submission = parsed.data;

  if (submission.website || submission.elapsedMs < TOO_FAST_MS) {
    log.warn(
      { honeypot: Boolean(submission.website), elapsedMs: submission.elapsedMs },
      "contact: dropped as automated",
    );
    return fakeSuccess();
  }

  const ipHash = hashClientIp(getClientIp(request));
  const rate = await checkContactRate(ipHash);
  if (!rate.allowed) {
    log.warn("contact: rate limited");
    return fail(HTTP_STATUS.tooManyRequests, "rate_limited", "Too many messages. Please try again later.", {
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const id = await createConversation(submission, {
    ipHash,
    userAgent: (request.headers.get("user-agent") ?? "").slice(0, TRUNCATE),
    page: (request.headers.get("referer") ?? "").slice(0, TRUNCATE),
    referrer: (request.headers.get("x-page-referrer") ?? "").slice(0, TRUNCATE),
  });
  log.info({ conversation: id, topic: submission.topic }, "contact: conversation created");
  return NextResponse.json({ ok: true, data: { id } }, { status: 201 });
});
