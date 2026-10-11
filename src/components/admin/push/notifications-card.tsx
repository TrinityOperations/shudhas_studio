"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/actions/push";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { computePushStatus, type PushStatus } from "@/lib/push/status";

type Status = "checking" | PushStatus;

/** The browser wants the VAPID public key as bytes. */
function keyToBytes(base64Url: string): Uint8Array {
  const padded = base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * OD-61: one card on the dashboard home. Subscribing happens only from the button (never an
 * automatic permission prompt), for the signed-in owner. Hidden by the page when VAPID keys
 * are not set.
 */
export function NotificationsCard({ publicKey }: { publicKey: string }) {
  const t = useT();
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supported = pushSupported();
    // register() returns the existing registration or rejects where workers are blocked; the
    // `ready` promise would never settle in that case and the card would stay on "Checking…".
    computePushStatus({
      supported,
      // iOS Safari exposes PushManager only once the site runs from the Home Screen.
      ios: isIos(),
      standalone: (navigator as { standalone?: boolean }).standalone === true,
      permission: supported ? Notification.permission : "default",
      register: () => navigator.serviceWorker.register("/sw.js", { scope: "/admin" }),
    }).then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(t("admin.push.denied"));
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(publicKey) as BufferSource,
        }));
      const result = await savePushSubscription(subscription.toJSON());
      if (!result.ok) {
        await subscription.unsubscribe();
        toast.error(t(result.error));
        return;
      }
      setStatus("on");
      toast.success(t("admin.push.enabled"));
    } catch {
      toast.error(t("admin.push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await removePushSubscription(endpoint);
      }
      setStatus("off");
      toast.success(t("admin.push.disabled"));
    } catch {
      toast.error(t("admin.push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const result = await sendTestPush();
      if (result.ok) toast.success(t("admin.push.testSent"));
      else toast.error(t(result.error));
    } finally {
      setBusy(false);
    }
  };

  const statusKey = {
    checking: "admin.push.status.checking",
    unsupported: "admin.push.status.unsupported",
    "ios-install": "admin.push.status.ios",
    denied: "admin.push.denied",
    off: "admin.push.status.off",
    on: "admin.push.status.on",
  } as const;

  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-labelledby="push-heading"
      data-testid="push-card"
      data-status={status}
    >
      <h2 id="push-heading" className="text-lg font-semibold">
        {t("admin.push.title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("admin.push.description")}</p>
      <p className="text-sm font-medium" aria-live="polite">
        {t(statusKey[status])}
      </p>
      <div className="flex flex-wrap gap-2">
        {status === "off" ? (
          <Button type="button" onClick={turnOn} disabled={busy}>
            {t("admin.push.enable")}
          </Button>
        ) : null}
        {status === "on" ? (
          <>
            <Button type="button" variant="outline" onClick={sendTest} disabled={busy}>
              {t("admin.push.test")}
            </Button>
            <Button type="button" variant="outline" onClick={turnOff} disabled={busy}>
              {t("admin.push.disable")}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}
