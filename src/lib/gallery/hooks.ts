import type { GallerySubmission } from "@/db/schema";
import { gallerySubmitted } from "@/lib/push/payloads";
import { sendPushToOwner } from "@/lib/push/send";
import { sendGallerySubmittedEmail } from "./emails";

/**
 * PW-72, OD-61: after a customer photo is stored as pending, email the owner and push to her
 * devices. Runs inside after(), and nothing here throws: a mail or push problem is logged and
 * can never undo a submission.
 */
export async function onGallerySubmitted(submission: GallerySubmission): Promise<void> {
  try {
    const [result] = await Promise.all([
      sendGallerySubmittedEmail(submission),
      sendPushToOwner(gallerySubmitted(submission)),
    ]);
    if (!result.ok) {
      console.error(`[gallery] owner email failed for ${submission.id}: ${result.error}`);
    }
  } catch (error) {
    console.error(`[gallery] onGallerySubmitted failed for ${submission.id}`, error);
  }
}
