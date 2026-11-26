/**
 * Server-only environment access. Values are read lazily so that `next build`
 * does not require secrets, and a missing value fails loudly at first use.
 */

const MIN_SESSION_SECRET_LENGTH = 32;

const required = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  mongodbUri: () => required("MONGODB_URI"),
  mongodbDb: () => process.env.MONGODB_DB?.trim() || "mm-portfolio",
  adminEmail: () => required("ADMIN_EMAIL"),
  adminAccessCode: () => required("ADMIN_ACCESS_CODE"),
  sessionSecret: () => {
    const secret = required("SESSION_SECRET");
    if (secret.length < MIN_SESSION_SECRET_LENGTH) {
      throw new Error(`SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters`);
    }
    return secret;
  },
  logLevel: () => process.env.LOG_LEVEL?.trim() || "info",
  isProduction: () => process.env.NODE_ENV === "production",
  /**
   * Vercel Web Analytics reading (Pulse, docs/screens/STUDIO_PULSE_BUSINESS.md). Optional: when the token or
   * project is missing, Pulse shows its setup card instead of data.
   */
  vercelAnalytics: () => {
    const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim();
    const project = process.env.VERCEL_ANALYTICS_PROJECT?.trim();
    const team = process.env.VERCEL_ANALYTICS_TEAM?.trim() || null;
    return token && project ? { token, project, team } : null;
  },
  /** The Vercel environment this server runs in; local development counts as "development". */
  vercelEnv: (): "production" | "preview" | "development" => {
    const value = process.env.VERCEL_ENV;
    return value === "production" || value === "preview" ? value : "development";
  },
};
