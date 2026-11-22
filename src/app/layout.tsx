import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Portfolio", template: "%s | Portfolio" },
  description: "Personal portfolio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/*
        Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes
        to <body> before React hydrates. This only ignores attribute
        differences on <body> itself; its children are still checked.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
