import { notFound } from "next/navigation";

// Unknown routes are 302-redirected here; render not-found.tsx with a real 404 status.
export default function NotFoundRoute() {
  notFound();
}
