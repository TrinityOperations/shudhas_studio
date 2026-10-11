import { NextResponse } from "next/server";

/**
 * OD-60: the dashboard's web app manifest, scoped to /admin so the public site is never
 * installable and never gets the service worker. Linked only from the dashboard layout's
 * metadata. Served without a session (src/proxy.ts allow-list): it holds no data.
 */
export function GET() {
  const manifest = {
    id: "/admin",
    name: "Shudha's Studio",
    short_name: "Shudha's",
    description: "The studio dashboard: products, bookings and site content.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#FBF9F6",
    theme_color: "#1E4A3A",
    lang: "en-AU",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
