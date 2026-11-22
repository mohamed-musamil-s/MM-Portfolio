import { z } from "zod";

/**
 * Login input limits shared by the API (validation) and the studio login form
 * (client-side checks before any request). Messages are not defined here: the
 * form shows its own database-managed copy for each failed rule.
 */

export const LOGIN_LIMITS = {
  emailMaxLength: 254,
  /** The access code's real length is never sent to the browser; this is only a floor. */
  codeMinLength: 4,
  codeMaxLength: 64,
} as const;

export const loginEmailSchema = z.string().trim().min(1).max(LOGIN_LIMITS.emailMaxLength).pipe(z.email());

export const accessCodeSchema = z.string().trim().min(LOGIN_LIMITS.codeMinLength).max(LOGIN_LIMITS.codeMaxLength);

export const initiateLoginSchema = z.object({ email: loginEmailSchema });

export const loginSchema = z.object({ email: loginEmailSchema, accessCode: accessCodeSchema });

/** Machine-readable error codes the login endpoints return; the form maps each to its own message. */
export const LOGIN_ERROR_CODES = [
  "invalid_input",
  "invalid_credentials",
  "locked",
  "challenge_expired",
  "forbidden",
  "internal_error",
] as const;
export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];
