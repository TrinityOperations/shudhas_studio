/**
 * Web Push is on only when all three VAPID variables are set. Read live from process.env (not
 * the cached serverEnv() snapshot) so a missing key never throws and the check is testable.
 */
export type VapidDetails = { subject: string; publicKey: string; privateKey: string };

export function vapidDetails(): VapidDetails | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  return { subject, publicKey, privateKey };
}

export function isPushConfigured(): boolean {
  return vapidDetails() !== null;
}
