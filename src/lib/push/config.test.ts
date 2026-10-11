import { afterEach, describe, expect, it } from "vitest";
import { isPushConfigured, vapidDetails } from "./config";

const KEYS = ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function setAll() {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BPub";
  process.env.VAPID_PRIVATE_KEY = "priv";
  process.env.VAPID_SUBJECT = "mailto:owner@example.com";
}

describe("push configuration", () => {
  it("is configured only when all three variables are set", () => {
    setAll();
    expect(isPushConfigured()).toBe(true);
    expect(vapidDetails()).toEqual({
      subject: "mailto:owner@example.com",
      publicKey: "BPub",
      privateKey: "priv",
    });
  });

  it.each(KEYS)("is off when %s is missing or empty", (key) => {
    setAll();
    delete process.env[key];
    expect(isPushConfigured()).toBe(false);
    expect(vapidDetails()).toBeNull();
    setAll();
    process.env[key] = "";
    expect(isPushConfigured()).toBe(false);
  });
});
