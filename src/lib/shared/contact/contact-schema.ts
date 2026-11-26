import { z } from "zod";

/**
 * What the portfolio's contact form sends (docs/features/CONTACT_MESSAGES.md).
 * Shared by the form (client checks) and POST /api/contact (the real check).
 */

export const CONTACT_LIMITS = { name: 80, email: 120, topic: 40, messageMin: 10, messageMax: 4000 } as const;

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(CONTACT_LIMITS.name),
  email: z.string().trim().toLowerCase().email().max(CONTACT_LIMITS.email),
  topic: z.string().trim().max(CONTACT_LIMITS.topic),
  message: z.string().trim().min(CONTACT_LIMITS.messageMin).max(CONTACT_LIMITS.messageMax),
  /** Honeypot: a field people never see. Anything in it means a bot. */
  website: z.string().max(200).optional(),
  /** How long the form was open before it was sent; bots send instantly. */
  elapsedMs: z.number().int().min(0).max(86_400_000),
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

/** A conversation as the studio's chat module sees it (no network metadata). */
export type ConversationStatus = "open" | "archived";

export type ConversationMessage = { from: "visitor" | "owner"; body: string; at: string };

export type ConversationSummary = {
  id: string;
  name: string;
  email: string;
  topic: string;
  status: ConversationStatus;
  unread: boolean;
  preview: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
};

export type Conversation = ConversationSummary & { messages: ConversationMessage[]; page: string; referrer: string };
