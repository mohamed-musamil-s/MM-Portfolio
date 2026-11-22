import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/server/auth/session";
import { getLogger } from "@/lib/server/logger";
import { safeStudioRedirect } from "@/lib/shared/routes";
import { LoginForm } from "@/components/studio/login-form";

export const metadata: Metadata = { title: "Studio login", robots: { index: false, follow: false } };

const log = getLogger("auth");

const hasActiveSession = async (): Promise<boolean> => {
  try {
    return (await getCurrentSession()) !== null;
  } catch (err) {
    // Keep the form reachable; the login API will report the failure as a 500.
    log.error({ err }, "login page: session lookup failed");
    return false;
  }
};

export default async function StudioLoginPage({ searchParams }: PageProps<"/studio/login">) {
  const { next } = await searchParams;
  const redirectTo = safeStudioRedirect(typeof next === "string" ? next : null);

  if (await hasActiveSession()) {
    redirect(redirectTo);
  }

  return (
    <main>
      <h1>Studio</h1>
      <p>Sign in with your admin email and access code.</p>
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
