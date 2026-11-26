import type { Metadata } from "next";
import { Pulse } from "@/components/studio/pulse/Pulse";
import { getPulse, PULSE_RANGES, type PulseRange } from "@/lib/server/analytics/vercel-analytics";
import { requireSession } from "@/lib/server/auth/guard";
import { getScreenContent } from "@/lib/server/content/screens";
import { ROUTES } from "@/lib/shared/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { modules } = await getScreenContent("studio-shell");
  return { title: modules.analytics.title };
}

const DEFAULT_RANGE: PulseRange = 30;

const toRange = (value: string | string[] | undefined): PulseRange => {
  const number = Number(Array.isArray(value) ? value[0] : value);
  return (PULSE_RANGES as readonly number[]).includes(number) ? (number as PulseRange) : DEFAULT_RANGE;
};

/** Pulse: Vercel Web Analytics (docs/screens/STUDIO_PULSE_BUSINESS.md). */
export default async function StudioAnalyticsPage({ searchParams }: PageProps<"/studio/analytics">) {
  await requireSession(ROUTES.studio.analytics);
  const range = toRange((await searchParams).range);
  const [shell, result] = await Promise.all([getScreenContent("studio-shell"), getPulse(range)]);
  return (
    <Pulse
      result={result}
      copy={shell.pulse}
      title={shell.modules.analytics.title}
      description={shell.modules.analytics.description}
    />
  );
}
