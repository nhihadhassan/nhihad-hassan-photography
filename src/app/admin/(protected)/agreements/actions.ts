"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createAgreementRequest,
  getAgreementRequestById,
  revokeAgreementRequest,
  updateAgreementAutomationSettings,
  updateAgreementDetails,
  updateAgreementIdentity,
  updateAgreementInviteDraft,
  type AgreementDetails,
} from "@/lib/agreements";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import { sendAgreementRequestEmail } from "@/lib/agreement-deliveries";
import { getAdminGallery } from "@/lib/admin-data";
import { agreementSignUrl } from "@/lib/agreement-url";
import { torontoLocalToUtc } from "@/lib/ics";
import { isWeddingAgreementType } from "@/data/wedding-agreement";
import { missingContactFields } from "@/lib/agreement-values";
import { contractAutomationValues } from "@/lib/contract-automation-values";
import { materializeAgreementWorkflow } from "@/lib/contract-automation";

const todayInToronto = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

async function emailAgreementSigners(input: {
  agreementRequestId: string;
  agreementUrl: string;
  expiresAt: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  secondName?: string;
  secondEmail?: string;
  missingFields?: string[];
  /** Admin-edited subject/message from the Preview & Send composer. Falls back to the auto-generated default when blank. */
  subject?: string | null;
  message?: string | null;
}) {
  const recipients = [
    { name: input.primaryName, email: input.primaryEmail },
    { name: input.secondName ?? null, email: input.secondEmail ?? null },
  ].filter((recipient): recipient is { name: string | null; email: string } => Boolean(recipient.email));
  if (!recipients.length) return { ok: false, message: "This agreement has no signer email." };

  const results = await Promise.all(recipients.map((recipient) => sendAgreementRequestEmail({
    agreementRequestId: input.agreementRequestId,
    clientEmail: recipient.email,
    clientName: recipient.name,
    agreementUrl: input.agreementUrl,
    expiresAt: input.expiresAt,
    missingFields: input.missingFields,
    subject: input.subject,
    message: input.message,
  })));
  const failed = results.filter((result) => !result.ok);

  // Save the composed wording so a resend or quick "Send now" keeps it.
  // Non-fatal: the email already went out either way.
  if (results.some((result) => result.ok)) {
    updateAgreementInviteDraft(input.agreementRequestId, {
      subject: input.subject?.trim() || null,
      message: input.message?.trim() || null,
    }).catch((err) => console.warn("[agreement-invite] draft save failed:", err));
  }

  if (failed.length) {
    return {
      ok: false,
      message: `${recipients.length - failed.length} of ${recipients.length} signer emails were sent. ${failed[0]?.message ?? "One delivery failed."}`,
    };
  }
  return {
    ok: true,
    message: recipients.length === 1
      ? `Agreement emailed to ${recipients[0].email}.`
      : `Agreement emailed to both required signers.`,
  };
}

/**
 * Step one of the document-first agreement flow: create a minimal draft
 * request (client + template + optional starting package) and hand back its
 * id so the caller can route straight into the document editor. No pricing,
 * dates, or policy text is required here — everything else is filled in
 * directly on the rendered contract.
 */
export async function createDraftAgreementAction(input: {
  galleryId?: string | null;
  calendarEventId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  template: string;
  type?: string | null;
  total?: string | null;
  date?: string | null;
  startTime?: string | null;
  coverageTime?: string | null;
  location?: string | null;
}): Promise<{ ok: boolean; message: string; id?: string }> {
  await requireAdmin();
  try {
    if (!input.clientName.trim()) {
      return { ok: false, message: "Enter a client name." };
    }
    const { id } = await createAgreementRequest({
      galleryId: input.galleryId ?? null,
      calendarEventId: input.calendarEventId ?? null,
      clientName: input.clientName.trim(),
      clientEmail: input.clientEmail?.trim() || null,
      details: {
        feeStructureVersion: "section-2",
        presentationVersion: "reference-v2",
        template: input.template,
        effectiveDate: todayInToronto(),
        type: input.type?.trim() || undefined,
        description: input.type?.trim() || undefined,
        total: input.total?.trim() || undefined,
        date: input.date?.trim() || undefined,
        startTime: input.startTime?.trim() || undefined,
        coverageTime: input.coverageTime?.trim() || undefined,
        location: input.location?.trim() || undefined,
        city: "Toronto",
        window: "1 year from delivery",
        licenseType: "Personal use only",
        secondShooter: "No",
        lateFeePercent: "2",
      },
    });
    revalidatePath("/admin/agreements");
    return { ok: true, message: "Draft created.", id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the agreement.",
    };
  }
}

export type SaveAgreementDraftInput = {
  clientName: string;
  clientEmail: string | null;
  message?: string | null;
  details: AgreementDetails;
};

/** Debounced autosave target for the document-first agreement builder. */
export async function saveAgreementDraftAction(
  id: string,
  input: SaveAgreementDraftInput,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await updateAgreementIdentity(id, {
      clientName: input.clientName.trim() || null,
      clientEmail: input.clientEmail?.trim() || null,
      message: input.message !== undefined ? input.message?.trim() || null : undefined,
      details: input.details,
    });
    revalidatePath("/admin/agreements");
    return { ok: true, message: "Saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Couldn't save.",
    };
  }
}

export async function createGalleryAgreementRequestAction(
  galleryId: string,
): Promise<{ ok: boolean; message: string; signUrl?: string }> {
  await requireAdmin();
  const gallery = await getAdminGallery(galleryId);
  if (!gallery) return { ok: false, message: "Gallery not found." };

  const details: AgreementDetails = {
    feeStructureVersion: "section-2",
    presentationVersion: "reference-v2",
    template: isWeddingAgreementType(gallery.title) ? "wedding" : "photography",
    effectiveDate: todayInToronto(),
    type: gallery.title,
    description: gallery.description ?? gallery.title,
    date: gallery.event_date ?? undefined,
    city: "Toronto",
    mealHours: "6",
    secondShooter: "No",
    window: "1 year from delivery",
    rehostingFee: "50",
    revisionPolicy: "Two rounds of minor revisions on up to 10 images, requested within 14 days of delivery.",
    archiveWindow: "1 year after delivery",
    cancellationPolicy: "30 or more days before the shoot: retainer only; 15 to 29 days: 50% of total; 14 days or fewer: 100% of total.",
    reschedulePolicy: "One free reschedule with at least 15 days' notice; the new date must be within 6 months.",
    lateFeePercent: "1.5",
    licenseType: "Personal use only",
    privacyOptOutFee: "Quoted on request",
    additionalCharges: "Travel outside the GTA, parking, permits, and rentals, if applicable",
  };

  try {
    const { id, token } = await createAgreementRequest({
      galleryId,
      clientName: gallery.client_name,
      clientEmail: gallery.client_email,
      message: gallery.title,
      details,
      remindersEnabled: Boolean(gallery.client_email),
    });
    const signUrl = agreementSignUrl(token);
    if (!gallery.client_email) {
      revalidatePath("/admin/agreements");
      revalidatePath("/admin/galleries");
      return {
        ok: true,
        message: "Signing link created, but this gallery has no client email, so no email was sent.",
        signUrl,
      };
    }
    const delivery = await sendAgreementRequestEmail({
      agreementRequestId: id,
      clientEmail: gallery.client_email,
      clientName: gallery.client_name,
      agreementUrl: signUrl,
      expiresAt: null,
      missingFields: missingContactFields(details),
    });
    revalidatePath("/admin/agreements");
    revalidatePath("/admin/galleries");
    return { ok: delivery.ok, message: delivery.message, signUrl };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create signing link.",
    };
  }
}

export async function sendAgreementRequestEmailAction(
  id: string,
  /** Explicit wording from the Preview & Send composer. Omit to reuse the saved/default wording (the quick "Send now" button does this). */
  overrides?: { subject?: string; message?: string },
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const request = await getAgreementRequestById(id);
    if (!request) return { ok: false, message: "Agreement request not found." };
    if (request.revoked_at) return { ok: false, message: "This signing link has been revoked." };
    if (request.signed_at) return { ok: false, message: "This agreement is already signed." };
    if (isAgreementPastExpiry(request)) {
      return { ok: false, message: "This agreement has expired and can no longer be emailed." };
    }
    if (!request.client_email) {
      return { ok: false, message: "This agreement has no client email. Add one before sending." };
    }
    const automation = contractAutomationValues(request.details);
    if (!automation.ok) {
      return {
        ok: false,
        message: `Complete the contract's ${automation.missing.join(", ")} before sending.`,
      };
    }

    const result = await emailAgreementSigners({
      agreementRequestId: request.id,
      agreementUrl: agreementSignUrl(request.token),
      expiresAt: request.expires_at,
      primaryName: request.client_name,
      primaryEmail: request.client_email,
      secondName: request.details.secondSignerName,
      secondEmail: request.details.secondSignerEmail,
      missingFields: missingContactFields(request.details),
      subject: overrides?.subject ?? request.invite_subject,
      message: overrides?.message ?? request.invite_message,
    });
    if (result.ok) {
      try {
        await materializeAgreementWorkflow(request.id);
      } catch (automationError) {
        return {
          ok: false,
          message: `The contract was sent, but its booking and invoice could not be prepared: ${
            automationError instanceof Error ? automationError.message : "unknown error"
          }`,
        };
      }
    }
    revalidatePath("/admin/agreements");
    revalidatePath("/admin");
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin/invoices");
    revalidatePath("/admin/clients");
    return { ok: result.ok, message: result.message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not email the agreement.",
    };
  }
}

export async function revokeAgreementRequestAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await revokeAgreementRequest(id);
    revalidatePath("/admin/agreements");
    return { ok: true, message: "Signing link revoked." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not revoke link.",
    };
  }
}

export async function updateAgreementAutomationAction(
  id: string,
  input: {
    expiresAt: string | null;
    remindersEnabled: boolean;
    reminderIntervalDays: number;
    reminderMaxSends: number;
  },
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const expiresAt = input.expiresAt ? torontoLocalToUtc(input.expiresAt) : null;
    if (input.expiresAt && (!expiresAt || expiresAt.getTime() <= Date.now())) {
      return { ok: false, message: "Choose an expiry date and time in the future." };
    }
    await updateAgreementAutomationSettings(id, {
      expiresAt: expiresAt?.toISOString() ?? null,
      remindersEnabled: input.remindersEnabled,
      reminderIntervalDays: Math.min(30, Math.max(1, Math.round(input.reminderIntervalDays))),
      reminderMaxSends: Math.min(10, Math.max(1, Math.round(input.reminderMaxSends))),
    });
    revalidatePath("/admin/agreements");
    return { ok: true, message: "Contract automation updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update contract automation.",
    };
  }
}

export async function updateAgreementClientAddressAction(
  id: string,
  clientAddress: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const request = await getAgreementRequestById(id);
    if (!request) return { ok: false, message: "Agreement request not found." };
    await updateAgreementDetails(id, {
      ...request.details,
      clientAddress: clientAddress.trim() || undefined,
    });
    revalidatePath("/admin/agreements");
    return { ok: true, message: "Client mailing address updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the client address.",
    };
  }
}
