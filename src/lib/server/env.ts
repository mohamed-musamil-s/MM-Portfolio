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
};
