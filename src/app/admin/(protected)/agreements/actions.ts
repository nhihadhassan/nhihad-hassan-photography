"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createAgreementRequest,
  revokeAgreementRequest,
  type AgreementDetails,
} from "@/lib/agreements";
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
    const { token } = await createAgreementRequest({
      galleryId: clean(formData.get("gallery_id")),
      clientName: clean(formData.get("client_name")),
      clientEmail: clean(formData.get("client_email")),
      message: clean(formData.get("message")),
      details: detailsFromForm(formData),
      markSent: formData.get("mark_sent") === "on",
    });
    revalidatePath("/admin/agreements");
    return { status: "success", message: "Signing link created.", signUrl: signUrlFor(token) };
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
    const { token } = await createAgreementRequest({
      galleryId,
      clientName: gallery.client_name,
      clientEmail: gallery.client_email,
      message: gallery.title,
      details: {
        type: gallery.title,
        date: gallery.event_date ?? undefined,
      },
      markSent: true,
    });
    revalidatePath("/admin/agreements");
    revalidatePath("/admin/galleries");
    return { ok: true, message: "Signing link created.", signUrl: signUrlFor(token) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create signing link.",
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
