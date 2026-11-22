import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BodyScope } from "@/components/studio/BodyScope";
import { LoginFlow } from "@/components/studio/login/LoginFlow";
import { LoginShowcase, LoginShowcaseBand } from "@/components/studio/login/LoginShowcase";
import { getCurrentSession } from "@/lib/server/auth/session";
import { getScreenContent } from "@/lib/server/content/screens";
import { env } from "@/lib/server/env";
import { getLogger } from "@/lib/server/logger";
import { safeStudioRedirect } from "@/lib/shared/routes";

// Content is edited in the database; render on every request.
export const dynamic = "force-dynamic";

const log = getLogger("auth");

/**
 * A numeric code of 4–8 digits gets one input box per digit. Showing the boxes
 * reveals the length, which the lockout makes an acceptable trade for the
 * faster entry (docs/auth-security.md). Anything else uses a masked field.
 */
const NUMERIC_CODE = /^\d{4,8}$/;
const codeBoxes = (): number | null => {
  const code = env.adminAccessCode().trim();
  return NUMERIC_CODE.test(code) ? code.length : null;
};

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getScreenContent("studio-login");
  return { title: meta.title, robots: { index: false, follow: false } };
}

const hasActiveSession = async (): Promise<boolean> => {
  try {
    return (await getCurrentSession()) !== null;
  } catch (err) {
    // Keep the form reachable; the login API will report the failure as a 500.
    log.error({ err }, "login page: session lookup failed");
    return false;
  }
};

/** /studio/login: split-screen, two-step sign-in (docs/screens/STUDIO_LOGIN_BUSINESS.md). */
export default async function StudioLoginPage({ searchParams }: PageProps<"/studio/login">) {
  const { next } = await searchParams;
  const redirectTo = safeStudioRedirect(typeof next === "string" ? next : null);

  if (await hasActiveSession()) {
    redirect(redirectTo);
  }

  const content = await getScreenContent("studio-login");

  return (
    <main
      data-studio-theme="light"
      className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
    >
      <BodyScope theme="light" />
      <LoginShowcase showcase={content.showcase} brandName={content.brand.name} />
      <div className="flex min-h-svh flex-col lg:min-h-0">
        <LoginShowcaseBand showcase={content.showcase} />
        <LoginFlow content={content} redirectTo={redirectTo} codeLength={codeBoxes()} />
      </div>
    </main>
  );
}
