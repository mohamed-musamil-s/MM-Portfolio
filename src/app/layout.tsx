import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MM Portfolio", template: "%s | MM Portfolio" },
  description: "Portfolio of Mohamed Musamil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
