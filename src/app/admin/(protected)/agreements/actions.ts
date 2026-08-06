"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createAgreementRequest,
  getAgreementRequestById,
  revokeAgreementRequest,
  updateAgreementAutomationSettings,
  type AgreementDetails,
} from "@/lib/agreements";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import { sendAgreementRequestEmail } from "@/lib/agreement-deliveries";
import { getAdminGallery } from "@/lib/admin-data";
import { siteUrl } from "@/lib/seo";
import { torontoLocalToUtc } from "@/lib/ics";
import { isWeddingAgreementType } from "@/data/wedding-agreement";

export type AgreementActionState = {
  status: "idle" | "success" | "error";
  message: string;
  signUrl?: string;
};

const clean = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

function detailsFromForm(formData: FormData): AgreementDetails {
  const pick = (k: string) => clean(formData.get(k)) ?? undefined;
  return {
    template: pick("template"),
    partner: pick("partner"),
    type: pick("type"),
    date: pick("date"),
    location: pick("location"),
    total: pick("total"),
    deposit: pick("deposit"),
    balance: pick("balance"),
    window: pick("window"),
  };
}

function signUrlFor(token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  return `${origin}/agreement/${token}`;
}

function integerSetting(formData: FormData, key: string, fallback: number, min: number, max: number) {
  const value = Number(clean(formData.get(key)));
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

export async function createAgreementRequestAction(
  _prev: AgreementActionState,
  formData: FormData,
): Promise<AgreementActionState> {
  await requireAdmin();
  try {
    const clientName = clean(formData.get("client_name"));
    const clientEmail = clean(formData.get("client_email"));
    const emailNow = formData.get("mark_sent") === "on";
    const remindersEnabled = formData.get("reminders_enabled") === "on";
    const expiryInput = clean(formData.get("expires_at"));
    const expiryDate = expiryInput ? torontoLocalToUtc(expiryInput) : null;
    if (expiryInput && (!expiryDate || expiryDate.getTime() <= Date.now())) {
      return {
        status: "error",
        message: "Choose an expiry date and time in the future.",
      };
    }
    const { id, token } = await createAgreementRequest({
      galleryId: clean(formData.get("gallery_id")),
      clientName,
      clientEmail,
      message: clean(formData.get("message")),
      details: detailsFromForm(formData),
      expiresAt: expiryDate?.toISOString() ?? null,
      remindersEnabled,
      reminderIntervalDays: integerSetting(formData, "reminder_interval_days", 3, 1, 30),
      reminderMaxSends: integerSetting(formData, "reminder_max_sends", 3, 1, 10),
    });
    const signUrl = signUrlFor(token);

    if (emailNow) {
      if (!clientEmail) {
        revalidatePath("/admin/agreements");
        return {
          status: "error",
          message: "Signing link created, but no email was sent because the client email is missing.",
          signUrl,
        };
      }
      const delivery = await sendAgreementRequestEmail({
        agreementRequestId: id,
        clientEmail,
        clientName,
        agreementUrl: signUrl,
        expiresAt: expiryDate?.toISOString() ?? null,
      });
      revalidatePath("/admin/agreements");
      return {
        status: delivery.ok ? "success" : "error",
        message: delivery.message,
        signUrl,
      };
    }

    revalidatePath("/admin/agreements");
    return {
      status: "success",
      message: "Signing link created as a draft. No email was sent.",
      signUrl,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create signing link.",
    };
  }
}

export async function createGalleryAgreementRequestAction(
  galleryId: string,
): Promise<{ ok: boolean; message: string; signUrl?: string }> {
  await requireAdmin();
  const gallery = await getAdminGallery(galleryId);
  if (!gallery) return { ok: false, message: "Gallery not found." };

  try {
    const { id, token } = await createAgreementRequest({
      galleryId,
      clientName: gallery.client_name,
      clientEmail: gallery.client_email,
      message: gallery.title,
      details: {
        template: isWeddingAgreementType(gallery.title) ? "wedding" : "photography",
        type: gallery.title,
        date: gallery.event_date ?? undefined,
      },
      remindersEnabled: Boolean(gallery.client_email),
    });
    const signUrl = signUrlFor(token);
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

    const result = await sendAgreementRequestEmail({
      agreementRequestId: request.id,
      clientEmail: request.client_email,
      clientName: request.client_name,
      agreementUrl: signUrlFor(request.token),
      expiresAt: request.expires_at,
    });
    revalidatePath("/admin/agreements");
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
