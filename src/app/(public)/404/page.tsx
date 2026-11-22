import { notFound } from "next/navigation";

// Content is edited in the database; render on every request so changes show immediately.
export const dynamic = "force-dynamic";

// Unknown routes are 302-redirected here; render ./not-found.tsx with a real 404 status.
export default function NotFoundRoute() {
  notFound();
}
