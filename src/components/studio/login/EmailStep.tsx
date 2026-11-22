"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/studio/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/studio/ui/form";
import { Input } from "@/components/studio/ui/input";
import { LOGIN_LIMITS } from "@/lib/shared/auth/login-input";
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
                  className="h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={pending || disabled} aria-busy={pending || undefined}>
          {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {pending ? copy.pending : copy.submit}
          {pending ? null : <ArrowRight aria-hidden />}
        </Button>
      </form>
    </Form>
  );
};
