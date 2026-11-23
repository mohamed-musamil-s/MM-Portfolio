import type { MetadataRoute } from "next";

/** Web app manifest: name and the home-screen icons (built by `npm run brand:icons`). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portfolio",
    short_name: "Portfolio",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F4F0",
    theme_color: "#232931",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
