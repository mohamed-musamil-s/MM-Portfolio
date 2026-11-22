import { StudioShell } from "@/components/studio/StudioShell";

/** Every /studio route (login included) renders on the studio design surface (docs/ADMIN_STYLE.md). */
export default function StudioRootLayout({ children }: LayoutProps<"/studio">) {
  return <StudioShell>{children}</StudioShell>;
}
