import { NotFoundScreen } from "@/components/not-found/NotFoundScreen";
import { getScreenContent } from "@/lib/server/content/screens";

/** Renders for notFound() thrown by ./page.tsx, inside the public shell, with a 404 status. */
export default async function NotFound() {
  const content = await getScreenContent("not-found");
  return <NotFoundScreen content={content} />;
}
