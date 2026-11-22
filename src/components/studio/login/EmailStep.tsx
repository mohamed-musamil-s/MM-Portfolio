"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/studio/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/studio/ui/form";
import { Input } from "@/components/studio/ui/input";
import { LOGIN_LIMITS } from "@/lib/shared/auth/login-input";
import { cn } from "@/lib/shared/cn";
import { AUTH_FIELD, AUTH_PRIMARY_BUTTON } from "./auth-styles";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";

type EmailStepProps = {
  copy: StudioLoginContent["emailStep"];
  errors: StudioLoginContent["errors"];
  defaultEmail: string;
  pending: boolean;
  disabled: boolean;
  onSubmit: (email: string) => void;
};

/** Step 1: the email field, validated in the browser before anything is sent. */
export const EmailStep = ({ copy, errors, defaultEmail, pending, disabled, onSubmit }: EmailStepProps) => {
  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, { error: errors.emailRequired })
          .max(LOGIN_LIMITS.emailMaxLength, { error: errors.emailInvalid })
          .pipe(z.email({ error: errors.emailInvalid })),
      }),
    [errors.emailInvalid, errors.emailRequired],
  );
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
    mode: "onTouched",
  });

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(({ email }) => onSubmit(email))} className="grid gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.label}</FormLabel>
              <div className="relative">
                <Mail
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    placeholder={copy.placeholder}
                    maxLength={LOGIN_LIMITS.emailMaxLength}
                    className={cn(AUTH_FIELD, "pl-11")}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className={AUTH_PRIMARY_BUTTON}
          disabled={pending || disabled}
          aria-busy={pending || undefined}
        >
          {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {pending ? copy.pending : copy.submit}
          {pending ? null : <ArrowRight aria-hidden />}
        </Button>
      </form>
    </Form>
  );
};
