"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createAgreementRequest,
  getAgreementRequestById,
  revokeAgreementRequest,
  type AgreementDetails,
} from "@/lib/agreements";
import { sendAgreementRequestEmail } from "@/lib/agreement-deliveries";
import { getAdminGallery } from "@/lib/admin-data";
import { siteUrl } from "@/lib/seo";

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

export async function createAgreementRequestAction(
  _prev: AgreementActionState,
  formData: FormData,
): Promise<AgreementActionState> {
  await requireAdmin();
  try {
    const clientName = clean(formData.get("client_name"));
    const clientEmail = clean(formData.get("client_email"));
    const emailNow = formData.get("mark_sent") === "on";
    const { id, token } = await createAgreementRequest({
      galleryId: clean(formData.get("gallery_id")),
      clientName,
      clientEmail,
      message: clean(formData.get("message")),
      details: detailsFromForm(formData),
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
        type: gallery.title,
        date: gallery.event_date ?? undefined,
      },
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
    if (!request.client_email) {
      return { ok: false, message: "This agreement has no client email. Add one before sending." };
    }

    const result = await sendAgreementRequestEmail({
      agreementRequestId: request.id,
      clientEmail: request.client_email,
      clientName: request.client_name,
      agreementUrl: signUrlFor(request.token),
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
