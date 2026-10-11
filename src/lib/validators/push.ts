import { z } from "zod";

/** A PushSubscription.toJSON() from the browser; push services are always https. */
export const pushEndpointSchema = z
  .string()
  .trim()
  .max(2000, "errors.tooLong")
  .refine((value) => /^https:\/\/\S+$/.test(value), "errors.invalidInput");

export const pushSubscriptionSchema = z.object({
  endpoint: pushEndpointSchema,
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
