import { NotFoundScreen } from "@/components/not-found/NotFoundScreen";
import { getScreenContent } from "@/lib/server/content/screens";

/** Renders for notFound() thrown by ./page.tsx, inside the public shell, with a 404 status. */
export default async function NotFound() {
  const [content, shared] = await Promise.all([getScreenContent("not-found"), getScreenContent("shared")]);
  return <NotFoundScreen content={content} shared={shared} />;
}
