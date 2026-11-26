import "server-only";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongodb";
import { contactConversationsCollection, type ContactConversationDocument } from "../db/collections";
import { env } from "../env";
import type {
  ContactSubmission,
  Conversation,
  ConversationStatus,
  ConversationSummary,
} from "@/lib/shared/contact/contact-schema";

/*
 * Contact-form conversations (docs/features/CONTACT_MESSAGES.md): stored one
 * per submission, read by the studio's chat module. Abuse limits count recent
 * sends per hashed client IP and overall.
 */

/** Sends allowed per client per hour, and overall per hour. */
export const CONTACT_RATE = { perClient: 5, overall: 120, windowMs: 60 * 60 * 1000 } as const;

const PREVIEW_LENGTH = 140;
const LIST_LIMIT = 200;

/** SHA-256 of the client IP keyed with the session secret: stable for rate limits, not reversible to the IP. */
export const hashClientIp = (ip: string): string =>
  createHash("sha256").update(`${env.sessionSecret()}:${ip}`).digest("hex");

export type RateCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export const checkContactRate = async (ipHash: string): Promise<RateCheck> => {
  const collection = contactConversationsCollection(await getDb());
  const since = new Date(Date.now() - CONTACT_RATE.windowMs);
  const [fromClient, overall] = await Promise.all([
    collection.countDocuments({ "meta.ipHash": ipHash, createdAt: { $gte: since } }),
    collection.countDocuments({ createdAt: { $gte: since } }),
  ]);
  if (fromClient >= CONTACT_RATE.perClient || overall >= CONTACT_RATE.overall) {
    return { allowed: false, retryAfterSeconds: Math.ceil(CONTACT_RATE.windowMs / 1000) };
  }
  return { allowed: true };
};

export const createConversation = async (
  submission: ContactSubmission,
  meta: ContactConversationDocument["meta"],
): Promise<string> => {
  const now = new Date();
  const result = await contactConversationsCollection(await getDb()).insertOne({
    visitor: { name: submission.name, email: submission.email },
    topic: submission.topic,
    status: "open",
    unread: true,
    messages: [{ from: "visitor", body: submission.message, at: now }],
    createdAt: now,
    lastMessageAt: now,
    meta,
  });
  return result.insertedId.toHexString();
};

const toSummary = (doc: ContactConversationDocument & { _id: ObjectId }): ConversationSummary => {
  const last = doc.messages.at(-1);
  return {
    id: doc._id.toHexString(),
    name: doc.visitor.name,
    email: doc.visitor.email,
    topic: doc.topic,
    status: doc.status,
    unread: doc.unread,
    preview: (last?.body ?? "").slice(0, PREVIEW_LENGTH),
    messageCount: doc.messages.length,
    lastMessageAt: doc.lastMessageAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
};

export const listConversations = async (): Promise<ConversationSummary[]> => {
  const docs = await contactConversationsCollection(await getDb())
    .find({}, { sort: { lastMessageAt: -1 }, limit: LIST_LIMIT })
    .toArray();
  return docs.map((doc) => toSummary(doc as ContactConversationDocument & { _id: ObjectId }));
};

const toObjectId = (id: string): ObjectId | null =>
  ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;

export const getConversation = async (id: string): Promise<Conversation | null> => {
  const _id = toObjectId(id);
  if (!_id) {
    return null;
  }
  const doc = await contactConversationsCollection(await getDb()).findOne({ _id });
  if (!doc) {
    return null;
  }
  return {
    ...toSummary({ ...doc, _id }),
    messages: doc.messages.map((message) => ({ ...message, at: message.at.toISOString() })),
    page: doc.meta.page,
    referrer: doc.meta.referrer,
  };
};

export const updateConversation = async (
  id: string,
  changes: { unread?: boolean; status?: ConversationStatus },
): Promise<boolean> => {
  const _id = toObjectId(id);
  if (!_id) {
    return false;
  }
  const result = await contactConversationsCollection(await getDb()).updateOne({ _id }, { $set: changes });
  return result.matchedCount === 1;
};
