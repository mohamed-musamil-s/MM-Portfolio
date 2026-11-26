import type { Collection, Db, ObjectId } from "mongodb";

export const COLLECTIONS = {
  sessions: "sessions",
  authAttempts: "auth_attempts",
  siteScreens: "site_screens",
  siteSettings: "site_settings",
  contactConversations: "contact_conversations",
  siteScreenVersions: "site_screen_versions",
} as const;

export type SessionDocument = {
  _id?: ObjectId;
  /** SHA-256 of the opaque session token. The raw token only lives in the cookie. */
  tokenHash: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  ip: string;
  userAgent: string;
};

export type AuthAttemptDocument = {
  /** `ip:<address>` or `global`. */
  _id: string;
  count: number;
  firstAt: Date;
  lockedUntil?: Date;
  expiresAt: Date;
};

export const sessionsCollection = (db: Db): Collection<SessionDocument> =>
  db.collection<SessionDocument>(COLLECTIONS.sessions);

export const authAttemptsCollection = (db: Db): Collection<AuthAttemptDocument> =>
  db.collection<AuthAttemptDocument>(COLLECTIONS.authAttempts);

/** Database-managed screen content (one document per screen, `_id` = screen slug). */
export type ScreenDocument = {
  _id: string;
  /** Validated against the screen's zod schema on every read and write. */
  content: unknown;
  /** Optimistic-concurrency counter; incremented on every save. */
  version: number;
  updatedAt: Date;
  updatedBy: string;
};

export const siteScreensCollection = (db: Db): Collection<ScreenDocument> =>
  db.collection<ScreenDocument>(COLLECTIONS.siteScreens);

/** Site-wide switches controlled from the admin panel (one document per setting, `_id` = setting key). */
export type MaintenanceSettingDocument = {
  _id: "maintenance";
  enabled: boolean;
  updatedAt: Date;
  updatedBy: string;
};

export const siteSettingsCollection = (db: Db): Collection<MaintenanceSettingDocument> =>
  db.collection<MaintenanceSettingDocument>(COLLECTIONS.siteSettings);

/** Which portfolio sections show (`_id: "sections"`, docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md). */
export type SectionVisibilityDocument = {
  _id: "sections";
  /** Missing keys mean visible. */
  visible: Partial<Record<string, boolean>>;
  updatedAt: Date;
  updatedBy: string;
};

export const sectionVisibilityCollection = (db: Db): Collection<SectionVisibilityDocument> =>
  db.collection<SectionVisibilityDocument>(COLLECTIONS.siteSettings);

/**
 * One conversation per contact-form submission (docs/features/CONTACT_MESSAGES.md).
 * Shaped for the studio's chat module: replies are appended to `messages`.
 */
export type ContactConversationDocument = {
  _id?: ObjectId;
  visitor: { name: string; email: string };
  topic: string;
  status: "open" | "archived";
  /** True until the owner opens it in the studio. */
  unread: boolean;
  messages: { from: "visitor" | "owner"; body: string; at: Date }[];
  createdAt: Date;
  lastMessageAt: Date;
  /** Kept for abuse limits and context; never shown on the public site. */
  meta: {
    /** SHA-256 of the client IP with the session secret (the raw IP is never stored). */
    ipHash: string;
    userAgent: string;
    page: string;
    referrer: string;
  };
};

export const contactConversationsCollection = (db: Db): Collection<ContactConversationDocument> =>
  db.collection<ContactConversationDocument>(COLLECTIONS.contactConversations);

/**
 * A saved version of a database-managed screen (Launchpad's version history,
 * docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md): the content as it was at `version`.
 */
export type ScreenVersionDocument = {
  _id?: ObjectId;
  slug: string;
  version: number;
  content: unknown;
  savedAt: Date;
  savedBy: string;
};

export const screenVersionsCollection = (db: Db): Collection<ScreenVersionDocument> =>
  db.collection<ScreenVersionDocument>(COLLECTIONS.siteScreenVersions);
