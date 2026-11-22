import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Monogram } from "@/components/brand/Monogram";
import { LoginFlow } from "@/components/studio/login/LoginFlow";
import { getCurrentSession } from "@/lib/server/auth/session";
import { getScreenContent } from "@/lib/server/content/screens";
import { getLogger } from "@/lib/server/logger";
import { safeStudioRedirect } from "@/lib/shared/routes";

// Content is edited in the database; render on every request.
export const dynamic = "force-dynamic";

const log = getLogger("auth");

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

/** /studio/login: two-step sign-in (docs/screens/STUDIO_LOGIN_BUSINESS.md). */
export default async function StudioLoginPage({ searchParams }: PageProps<"/studio/login">) {
  const { next } = await searchParams;
  const redirectTo = safeStudioRedirect(typeof next === "string" ? next : null);

  if (await hasActiveSession()) {
    redirect(redirectTo);
  }

  const content = await getScreenContent("studio-login");

  return (
    <main className="relative isolate grid min-h-svh place-items-center bg-background px-4 py-12">
      {/* Faint dot grid: the only decoration on the screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--studio-border)_1px,transparent_1px)] mask-radial-from-40% mask-radial-to-80% bg-size-[20px_20px]"
      />
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-3">
          <Monogram dot="letter" className="h-5 w-auto text-foreground" />
          <span aria-hidden className="h-4 w-px bg-border" />
          <span className="text-sm font-semibold tracking-tight">{content.brand.name}</span>
        </div>
        <LoginFlow content={content} redirectTo={redirectTo} />
        <p className="text-center text-xs leading-relaxed text-muted-foreground">{content.footer.note}</p>
      </div>
    </main>
  );
}
