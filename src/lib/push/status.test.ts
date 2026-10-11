import { describe, expect, it, vi } from "vitest";
import { computePushStatus, type PushEnvironment } from "./status";

const registration = (subscription: unknown) => ({
  pushManager: { getSubscription: async () => subscription },
});

const base: PushEnvironment = {
  supported: true,
  ios: false,
  standalone: false,
  permission: "default",
  register: async () => registration(null),
};

describe("computePushStatus", () => {
  it("is unsupported when the service worker registration rejects", async () => {
    const register = vi.fn(async () => {
      throw new DOMException("Service workers are disabled", "SecurityError");
    });
    await expect(computePushStatus({ ...base, register })).resolves.toBe("unsupported");
    expect(register).toHaveBeenCalledOnce();
  });

  it("is unsupported when getSubscription rejects", async () => {
    const register = async () => ({
      pushManager: {
        getSubscription: async () => {
          throw new Error("no push service");
        },
      },
    });
    await expect(computePushStatus({ ...base, register })).resolves.toBe("unsupported");
  });

  it("is unsupported without PushManager, or the Home Screen hint on an iPhone browser tab", async () => {
    await expect(computePushStatus({ ...base, supported: false })).resolves.toBe("unsupported");
    await expect(computePushStatus({ ...base, supported: false, ios: true })).resolves.toBe(
      "ios-install",
    );
    await expect(
      computePushStatus({ ...base, supported: false, ios: true, standalone: true }),
    ).resolves.toBe("unsupported");
  });

  it("is denied when the browser already blocks notifications, without registering", async () => {
    const register = vi.fn(async () => registration(null));
    await expect(computePushStatus({ ...base, permission: "denied", register })).resolves.toBe(
      "denied",
    );
    expect(register).not.toHaveBeenCalled();
  });

  it("is on or off from the existing subscription", async () => {
    await expect(computePushStatus(base)).resolves.toBe("off");
    await expect(
      computePushStatus({ ...base, permission: "granted", register: async () => registration({}) }),
    ).resolves.toBe("on");
  });
});
