"use client";

import { Analytics } from "@vercel/analytics/next";
import { ROUTES } from "@/lib/shared/routes";

/**
 * Vercel Web Analytics for the public pages (docs/screens/STUDIO_PULSE_BUSINESS.md).
 * Content Forge's preview frames (/preview/...) are the owner working, not visitors: they are not counted.
 */
export const SiteAnalytics = () => (
  <Analytics beforeSend={(event) => (new URL(event.url).pathname.startsWith(`${ROUTES.preview}/`) ? null : event)} />
);
