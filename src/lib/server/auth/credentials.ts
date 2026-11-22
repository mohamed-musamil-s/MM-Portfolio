import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "../env";

/**
 * Hashing both sides first gives equal-length buffers, so timingSafeEqual never
 * throws and the comparison time does not leak the expected value's length.
 */
const digest = (value: string): Buffer => createHash("sha256").update(value, "utf8").digest();

const safeEqual = (a: string, b: string): boolean => timingSafeEqual(digest(a), digest(b));

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Both checks always run, so a wrong email and a wrong code take the same time. */
export const verifyAdminCredentials = (email: string, accessCode: string): boolean => {
  const emailMatches = safeEqual(normalizeEmail(email), normalizeEmail(env.adminEmail()));
  const codeMatches = safeEqual(accessCode.trim(), env.adminAccessCode().trim());
  return emailMatches && codeMatches;
};
