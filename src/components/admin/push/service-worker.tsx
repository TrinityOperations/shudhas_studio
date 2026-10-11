"use client";
import { useEffect } from "react";

/**
 * OD-60: registers the dashboard's service worker (public/sw.js) with scope /admin. Registration
 * on load is fine; asking for notification permission is not, so that happens only from the
 * card's button (notifications-card.tsx). Renders nothing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/admin" }).catch((error) => {
      console.warn("[pwa] service worker registration failed", error);
    });
  }, []);
  return null;
}
