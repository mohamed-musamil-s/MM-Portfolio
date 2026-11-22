"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Check, Eye, EyeOff, LoaderCircle, PencilLine, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/studio/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/studio/ui/form";
import { Input } from "@/components/studio/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/studio/ui/input-otp";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { LOGIN_LIMITS } from "@/lib/shared/auth/login-input";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";
import { cn } from "@/lib/shared/cn";
import { AUTH_FIELD, AUTH_PRIMARY_BUTTON } from "./auth-styles";

type CodeStepProps = {
  copy: StudioLoginContent["codeStep"];
  errors: StudioLoginContent["errors"];
  email: string;
  /** Number of boxes for a numeric code (4–8), or null to use a plain masked field. */
  codeLength: number | null;
  status: "idle" | "pending" | "success";
  disabled: boolean;
  /** Resolves false when the code was rejected; the field is then cleared and refocused. */
  onSubmit: (accessCode: string) => Promise<boolean>;
  onBack: () => void;
};

/** The email from step 1 as an identity chip, with an icon button back to step 1. */
const IdentityRow = ({
  email,
  backLabel,
  onBack,
  busy,
}: {
  email: string;
  backLabel: string;
  onBack: () => void;
  busy: boolean;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border bg-card p-2 pl-2.5 shadow-xs">
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-aurora-indigo text-sm font-semibold text-primary-foreground uppercase"
    >
      {email.charAt(0)}
    </span>
    <span className="min-w-0 flex-1 truncate text-sm font-medium" title={email}>
      {email}
    </span>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl text-muted-foreground hover:text-foreground"
          aria-label={backLabel}
          disabled={busy}
          onClick={onBack}
        >
          <PencilLine aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{backLabel}</TooltipContent>
    </Tooltip>
  </div>
);

/** Step 2: the access code. Numeric codes get one box per digit and submit on the last one. */
export const CodeStep = ({ copy, errors, email, codeLength, status, disabled, onSubmit, onBack }: CodeStepProps) => {
  const [revealed, setRevealed] = useState(false);
  const minLength = codeLength ?? LOGIN_LIMITS.codeMinLength;
  const schema = useMemo(
    () =>
      z.object({
        accessCode: z
          .string()
          .trim()
          .min(1, { error: errors.codeRequired })
          .min(minLength, { error: errors.codeTooShort })
          .max(LOGIN_LIMITS.codeMaxLength, { error: errors.codeTooShort }),
      }),
    [errors.codeRequired, errors.codeTooShort, minLength],
  );
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { accessCode: "" },
    mode: "onSubmit",
  });
  const busy = status !== "idle";

  const submit = form.handleSubmit(async ({ accessCode }) => {
    if (!(await onSubmit(accessCode))) {
      form.reset();
      // The field is still disabled from the pending state until the next render.
      setTimeout(() => form.setFocus("accessCode"), 0);
    }
  });

  const revealToggle = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={revealed ? copy.hide : copy.show}
      onClick={() => setRevealed((value) => !value)}
    >
      {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
    </Button>
  );

  return (
    <Form {...form}>
      <form noValidate onSubmit={submit} className="grid gap-6">
        {/* Lets password managers pair the code with the email from step 1. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <IdentityRow email={email} backLabel={copy.back} onBack={onBack} busy={busy} />
        <FormField
          control={form.control}
          name="accessCode"
          render={({ field }) => (
            <FormItem className="gap-3">
              <div className="flex items-center justify-between">
                <FormLabel>{copy.label}</FormLabel>
                {revealToggle}
              </div>
              <FormControl>
                {codeLength ? (
                  <InputOTP
                    {...field}
                    maxLength={codeLength}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="current-password"
                    autoFocus
                    disabled={busy || disabled}
                    onComplete={() => void submit()}
                    containerClassName="w-full"
                  >
                    <InputOTPGroup className="grid w-full auto-cols-fr grid-flow-col gap-3">
                      {Array.from({ length: codeLength }, (_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          masked={!revealed}
                          className="h-16 w-full rounded-2xl border bg-card text-3xl font-semibold shadow-xs first:rounded-2xl last:rounded-2xl data-[active=true]:ring-4 data-[active=true]:ring-ring/15 data-[filled=true]:border-primary/50 data-[filled=true]:bg-primary/5"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                ) : (
                  <Input
                    {...field}
                    type={revealed ? "text" : "password"}
                    autoComplete="current-password"
                    autoFocus
                    maxLength={LOGIN_LIMITS.codeMaxLength}
                    className={cn(AUTH_FIELD, "font-code tracking-[0.3em]")}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className={AUTH_PRIMARY_BUTTON}
          disabled={busy || disabled}
          aria-busy={status === "pending" || undefined}
        >
          {status === "pending" ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {status === "success" ? <Check aria-hidden /> : null}
          {status === "idle" ? <ShieldCheck aria-hidden /> : null}
          {status === "pending" ? copy.pending : status === "success" ? copy.success : copy.submit}
        </Button>
      </form>
    </Form>
  );
};
