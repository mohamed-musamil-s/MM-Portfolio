import type { Metadata } from "next";
import { getScreenContent } from "@/lib/server/content/screens";

// The page throws notFound(), so its own metadata never applies; the segment layout supplies it.
export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getScreenContent("not-found");
  return { title: meta.title, description: meta.description };
}

export default function NotFoundLayout({ children }: LayoutProps<"/404">) {
  return children;
}
