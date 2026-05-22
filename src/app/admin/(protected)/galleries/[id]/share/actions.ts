"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createShareLink, revokeShareLink } from "@/lib/share-links";

export type ShareLinkActionState = {
  status: "idle" | "success" | "error";
  message: string;
  shareUrl?: string;
};

const MAX_PHOTOS = 500;

export async function createShareLinkAction(
  _prev: ShareLinkActionState,
  formData: FormData,
): Promise<ShareLinkActionState> {
  await requireAdmin();

  const galleryId = String(formData.get("gallery_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const recipientLabel = String(formData.get("recipient_label") ?? "").trim() || null;
  const expiresAt = String(formData.get("expires_at") ?? "").trim() || null;
  const photoIds = formData
    .getAll("photo_ids")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);

  if (!galleryId) {
    return { status: "error", message: "Missing gallery." };
  }
  if (!title) {
    return { status: "error", message: "Share link title is required." };
  }
  if (photoIds.length === 0) {
    return { status: "error", message: "Select at least one photo." };
  }
  if (photoIds.length > MAX_PHOTOS) {
    return {
      status: "error",
      message: `Too many photos selected (max ${MAX_PHOTOS}).`,
    };
  }

  let parsedExpiry: string | null = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) {
      return { status: "error", message: "Invalid expiry date." };
    }
    parsedExpiry = d.toISOString();
  }

  try {
    const { token } = await createShareLink({
      galleryId,
      title,
      recipientLabel,
      expiresAt: parsedExpiry,
      photoIds,
    });

    const siteOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://nhihadhassan.ca";
    const shareUrl = `${siteOrigin}/share/${token}`;

    revalidatePath(`/admin/galleries/${galleryId}/share`);

    return {
      status: "success",
      message: "Share link created.",
      shareUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create share link.";
    return { status: "error", message };
  }
}

export async function revokeShareLinkAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  try {
    await revokeShareLink(id);
    return { ok: true, message: "Link revoked." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke link.";
    return { ok: false, message };
  }
}
