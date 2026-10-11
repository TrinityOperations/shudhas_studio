import { z } from "zod";

// Server-only env, validated once on first use (lazy so `next build` without secrets still works).
// Deliberately does not import `server-only`: drizzle.config.ts and db/seed.ts run under plain Node.
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().optional(),
  /** Max connections per process (default 10). Lower it on Netlify, where every function instance has its own pool. */
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  /** Sender shown to customers. Resend's sandbox sender works until the studio domain is verified. */
  EMAIL_FROM: z.string().min(3).default("Shudha's Studio <onboarding@resend.dev>"),
  /** Set to "1" to log emails instead of sending (also implied by NODE_ENV=test or a non-"re_" key). */
  EMAIL_DRY_RUN: z.string().optional(),
  /** Bearer token for /api/cron/reminders; unset = the job is disabled (503). */
  CRON_SECRET: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().min(16).optional()),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  OWNER_EMAIL: z.email(),
  /**
   * Web Push (OD-61). All three or none: src/lib/push/config.ts reads them live and push stays
   * off (no card, no subscriptions, sends are a logged no-op) while any is missing.
   * Generate a pair with `npx web-push generate-vapid-keys`. The private key is never logged.
   */
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  /** `mailto:` address or https URL the push services can contact about this sender. */
  VAPID_SUBJECT: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
      const missing = Object.keys(z.flattenError(result.error).fieldErrors).join(", ");
      throw new Error(`Missing or invalid server environment variables: ${missing}`);
    }
    cached = result.data;
  }
  return cached;
}
