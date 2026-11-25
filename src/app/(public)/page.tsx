import { ReplaceRoute } from "@/components/public/ReplaceRoute";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { ROUTES } from "@/lib/shared/routes";

// The maintenance flag can change at any time from the studio.
export const dynamic = "force-dynamic";

/**
 * Home (`/`). The name splash plays over it on every visit (public layout).
 * While maintenance mode is on, the page moves on to `/maintenance` underneath
 * the splash, so the splash's exit reveals the maintenance page. The portfolio
 * itself is not built yet.
 */
export default async function HomePage() {
  const maintenance = await isMaintenanceEnabled();
  return <main>{maintenance ? <ReplaceRoute href={ROUTES.maintenance} /> : null}</main>;
}
