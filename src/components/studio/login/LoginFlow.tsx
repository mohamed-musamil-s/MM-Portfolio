"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";
import { cn } from "@/lib/shared/cn";
import { ROUTES } from "@/lib/shared/routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/studio/ui/card";
import { CodeStep } from "./CodeStep";
import { EmailStep } from "./EmailStep";
import { FormAlert } from "./FormAlert";
import { postLogin, type LoginApiResult } from "./login-api";

/*
 * Two-step studio sign-in (docs/screens/STUDIO_LOGIN_BUSINESS.md):
 *   1. email → POST /api/auth/initiate-login (sets a 10-minute challenge cookie)
 *   2. access code → POST /api/auth/login → session cookie → redirect
 *
 * Step 1 answers the same for every well-formed email, so the screen never
 * reveals which address is authorised; a wrong email surfaces at step 2 as
 * "email or access code is incorrect". A lockout (429) disables both steps
 * until it expires.
 */

type Step = "email" | "code";
const STEP_ORDER: Step[] = ["email", "code"];

type LoginFlowProps = {
  content: StudioLoginContent;
  /** Where to go after signing in (already validated as a /studio path). */
  redirectTo: string;
};

const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

/** Turns a failed API result into the content's message for it. */
const messageFor = (result: Extract<LoginApiResult, { ok: false }>, errors: StudioLoginContent["errors"]): string => {
  switch (result.code) {
    case "invalid_credentials":
      return errors.invalidCredentials;
    case "locked":
      return fill(errors.locked, { minutes: Math.max(1, Math.ceil((result.retryAfterSeconds ?? 60) / 60)) });
    case "challenge_expired":
      return errors.challengeExpired;
    case "network":
      return errors.network;
    case "invalid_input":
    case "forbidden":
    case "internal_error":
      return errors.generic;
  }
};

/** While a lockout lasts, submitting is disabled; it re-enables itself when the time is up. */
const useLockout = () => {
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  useEffect(() => {
    if (lockedUntil === null) {
      return;
    }
    const timer = setTimeout(() => setLockedUntil(null), Math.max(0, lockedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [lockedUntil]);
  return {
    locked: lockedUntil !== null,
    lockFor: (seconds = 60) => setLockedUntil(Date.now() + seconds * 1000),
  };
};

export const LoginFlow = ({ content, redirectTo }: LoginFlowProps) => {
  const router = useRouter();
  const { tokens, reducedMotion } = useMotionTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");
  const lockout = useLockout();

  const fail = (result: Extract<LoginApiResult, { ok: false }>) => {
    if (result.code === "locked") {
      lockout.lockFor(result.retryAfterSeconds);
    }
    if (result.code === "challenge_expired") {
      setStep("email");
    }
    setError(messageFor(result, content.errors));
    setStatus("idle");
  };

  const submitEmail = async (value: string) => {
    setStatus("pending");
    setError(null);
    const result = await postLogin(ROUTES.api.initiateLogin, { email: value });
    if (!result.ok) {
      fail(result);
      return;
    }
    setEmail(value);
    setStatus("idle");
    setStep("code");
  };

  const submitCode = async (accessCode: string) => {
    setStatus("pending");
    setError(null);
    const result = await postLogin(ROUTES.api.login, { email, accessCode });
    if (!result.ok) {
      fail(result);
      return false;
    }
    setStatus("success");
    router.replace(redirectTo);
    router.refresh();
    return true;
  };

  const goBack = () => {
    setError(null);
    setStep("email");
  };

  const stepIndex = STEP_ORDER.indexOf(step);
  const direction = step === "code" ? 1 : -1;
  const slide = reducedMotion ? 0 : 16;
  const copy = step === "email" ? content.emailStep : content.codeStep;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Step indicator */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {fill(content.stepIndicator, { current: stepIndex + 1, total: STEP_ORDER.length })}
        </span>
        <span aria-hidden className="flex gap-1.5">
          {STEP_ORDER.map((key, index) => (
            <span key={key} className="relative h-1 w-8 overflow-hidden rounded-full bg-muted">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-primary"
                initial={false}
                animate={{ scaleX: index <= stepIndex ? 1 : 0 }}
                transition={{ duration: tokens.duration.slow, ease: tokens.ease }}
              />
            </span>
          ))}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: direction * slide }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * slide }}
          transition={{ duration: tokens.duration.slow, ease: tokens.ease }}
          className="flex flex-col gap-6 py-6"
        >
          <CardHeader className="gap-2">
            <CardTitle className="text-xl tracking-tight">{copy.title}</CardTitle>
            <CardDescription className="leading-relaxed">
              {step === "email" ? (
                content.emailStep.description
              ) : (
                <DescriptionWithEmail template={content.codeStep.description} email={email} />
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormAlert title={content.errors.title} message={error} />
            {step === "email" ? (
              <EmailStep
                copy={content.emailStep}
                errors={content.errors}
                defaultEmail={email}
                pending={status === "pending"}
                disabled={lockout.locked}
                onSubmit={submitEmail}
              />
            ) : (
              <CodeStep
                copy={content.codeStep}
                errors={content.errors}
                email={email}
                status={status}
                disabled={lockout.locked}
                onSubmit={submitCode}
                onBack={goBack}
              />
            )}
          </CardContent>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
};

/** Renders the code-step description with the email from step 1 set as a monospace chip. */
const DescriptionWithEmail = ({ template, email }: { template: string; email: string }) => {
  const [before, after] = template.split("{email}");
  return (
    <>
      {before}
      <span
        className={cn(
          "inline-block max-w-full truncate rounded-sm bg-muted px-1.5 py-0.5 align-bottom font-code text-[0.8125rem] leading-snug text-foreground",
          after === undefined && "hidden",
        )}
        title={email}
      >
        {email}
      </span>
      {after}
    </>
  );
};
