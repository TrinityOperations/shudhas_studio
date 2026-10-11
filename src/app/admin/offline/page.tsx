import type { Metadata } from "next";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.push.offline.title"), robots: { index: false, follow: false } };
}

/**
 * OD-60: the offline shell the service worker (public/sw.js) shows when a dashboard navigation
 * fails. Static, no data, no auth; served without a session (src/proxy.ts allow-list). The
 * worker caches only this HTML, not the stylesheet or scripts, so the few styles it needs are
 * inline and the Retry button works without React: it reloads through a tiny inline script.
 */
export default async function OfflinePage() {
  const t = await getT();
  return (
    <main
      id="main"
      data-testid="offline-shell"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        background: "#fbf9f6",
        color: "#2a2420",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "28rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          {t("admin.push.offline.title")}
        </h1>
        <p style={{ margin: "0 0 1.5rem", color: "#4e4740" }}>{t("admin.push.offline.body")}</p>
        <button
          type="button"
          id="offline-retry"
          style={{
            minHeight: "44px",
            padding: "0 1.5rem",
            borderRadius: "9999px",
            border: 0,
            background: "#1e4a3a",
            color: "#fff",
            font: "inherit",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {t("admin.push.offline.retry")}
        </button>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.getElementById("offline-retry").addEventListener("click",function(){location.reload()});',
          }}
        />
      </div>
    </main>
  );
}
