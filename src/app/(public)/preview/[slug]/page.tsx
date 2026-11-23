import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LivePreview } from "@/components/public/LivePreview";
import { requireSession } from "@/lib/server/auth/guard";
import { getScreenContent } from "@/lib/server/content/screens";
import { isPreviewableScreen } from "@/lib/shared/content/preview-protocol";
import { ROUTES } from "@/lib/shared/routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Plain JSON (dates become ISO strings), like the editor's drafts. */
const toJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

/**
 * Live preview of a portfolio screen for Content Forge's preview frame
 * (docs/components/CONTENT_FORGE_BUSINESS.md §2b). Signed-in only; framable
 * by the same origin only (next.config.ts).
 */
export default async function PreviewPage({ params }: PageProps<"/preview/[slug]">) {
  const { slug } = await params;
  if (!isPreviewableScreen(slug)) {
    notFound();
  }
  await requireSession(`${ROUTES.preview}/${slug}`);
  const [content, shared] = await Promise.all([getScreenContent(slug), getScreenContent("shared")]);
  return <LivePreview slug={slug} initialContent={toJson(content)} initialShared={toJson(shared)} />;
}
