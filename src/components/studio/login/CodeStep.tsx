"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/studio/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/studio/ui/form";
import { Input } from "@/components/studio/ui/input";
import { LOGIN_LIMITS } from "@/lib/shared/auth/login-input";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";

type CodeStepProps = {
  copy: StudioLoginContent["codeStep"];
  errors: StudioLoginContent["errors"];
  email: string;
  status: "idle" | "pending" | "success";
  disabled: boolean;
  /** Resolves false when the code was rejected; the field is then cleared and refocused. */
  onSubmit: (accessCode: string) => Promise<boolean>;
  onBack: () => void;
};

/** Step 2: the access code (masked, numeric keypad), plus a way back to change the email. */
export const CodeStep = ({ copy, errors, email, status, disabled, onSubmit, onBack }: CodeStepProps) => {
  const [revealed, setRevealed] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        accessCode: z
          .string()
          .trim()
          .min(1, { error: errors.codeRequired })
          .min(LOGIN_LIMITS.codeMinLength, { error: errors.codeTooShort })
          .max(LOGIN_LIMITS.codeMaxLength, { error: errors.codeTooShort }),
      }),
    [errors.codeRequired, errors.codeTooShort],
  );
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { accessCode: "" },
    mode: "onTouched",
  });
  const busy = status !== "idle";

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(async ({ accessCode }) => {
          if (!(await onSubmit(accessCode))) {
            form.reset();
            form.setFocus("accessCode");
          }
        })}
        className="grid gap-6"
      >
        {/* Lets password managers pair the code with the email from step 1. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <FormField
          control={form.control}
          name="accessCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.label}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={revealed ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="current-password"
                    autoFocus
                    maxLength={LOGIN_LIMITS.codeMaxLength}
                    className="h-10 pr-10 font-code tracking-[0.3em]"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                  aria-label={revealed ? copy.hide : copy.show}
                  onClick={() => setRevealed((value) => !value)}
                >
                  {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3">
          <Button type="submit" size="lg" disabled={busy || disabled} aria-busy={status === "pending" || undefined}>
            {status === "pending" ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
            {status === "success" ? <Check aria-hidden /> : null}
            {status === "idle" ? <ShieldCheck aria-hidden /> : null}
            {status === "pending" ? copy.pending : status === "success" ? copy.success : copy.submit}
          </Button>
          <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={onBack}>
            <ArrowLeft aria-hidden />
            {copy.back}
          </Button>
        </div>
      </form>
    </Form>
  );
};
