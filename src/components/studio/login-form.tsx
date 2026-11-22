"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/lib/shared/routes";

type LoginFormProps = { redirectTo: string };

type LoginResponse = { ok: true; data: { redirectTo: string } } | { ok: false; error: { message: string } };

const GENERIC_ERROR = "Something went wrong. Please try again.";

export const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const response = await fetch(ROUTES.api.login, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), accessCode: form.get("accessCode") }),
      });
      const body = (await response.json().catch(() => null)) as LoginResponse | null;

      if (body?.ok) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }
      setError(body?.error.message ?? GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    }
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      </div>
      <div>
        <label htmlFor="accessCode">Access code</label>
        <input
          id="accessCode"
          name="accessCode"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          maxLength={64}
        />
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};
