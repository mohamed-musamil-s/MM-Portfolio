import { PublicShell } from "@/components/public/PublicShell";

/** All public routes share the editorial surface (docs/STYLE.md). /studio never renders inside it. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <PublicShell>{children}</PublicShell>;
}
