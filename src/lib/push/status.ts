/**
 * What the Notifications card shows for this device. Pure apart from the injected `register`,
 * so it is unit-tested in node. It settles in every case: a rejected service-worker
 * registration (embedded browsers that block workers) or a missing PushManager is
 * "unsupported", never a hanging "checking".
 */
export type PushStatus = "unsupported" | "ios-install" | "denied" | "off" | "on";

export type PushEnvironment = {
  /** serviceWorker, PushManager and Notification all exist. */
  supported: boolean;
  ios: boolean;
  /** Running from the Home Screen (iOS exposes push only then). */
  standalone: boolean;
  permission: NotificationPermission;
  /** Registers (or returns) the dashboard's worker; may reject. */
  register: () => Promise<{ pushManager: { getSubscription(): Promise<unknown | null> } }>;
};

export async function computePushStatus(env: PushEnvironment): Promise<PushStatus> {
  if (!env.supported) return env.ios && !env.standalone ? "ios-install" : "unsupported";
  if (env.permission === "denied") return "denied";
  try {
    const registration = await env.register();
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? "on" : "off";
  } catch {
    return "unsupported";
  }
}
