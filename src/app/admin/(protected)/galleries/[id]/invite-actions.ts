"use server";

import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasGalleryInviteConfig, getGalleryInviteConfig } from "@/lib/env";
import { buildGalleryInviteEmail } from "@/lib/emails/gallery-invite";
import { getAdminGallery, getGalleryEmailCoverUrl } from "@/lib/admin-data";
import { brandConfig } from "@/lib/config";
import { revalidatePath } from "next/cache";

export type InviteActionResult = {
  ok: boolean;
  message: string;
};

/** Compose overrides from the Share screen. All optional. */
export type SendInviteInput = {
  /** Recipient override. Falls back to the gallery's stored client_email. */
  recipient?: string;
  /** Subject override. Falls back to the saved/default subject. */
  subject?: string;
  /** Message body override. Falls back to the saved/default message. */
  message?: string;
  /** When false, the gallery password is left out even if one is set. */
  includePassword?: boolean;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Sends the gallery invite email. The subject/message the admin composed are
 * saved back onto the gallery so a later resend keeps the same wording. Logs
 * the send in gallery_invite_log so the admin UI can show "last sent" info.
 */
export async function sendGalleryInvite(
  galleryId: string,
  input: SendInviteInput = {},
): Promise<InviteActionResult> {
  await requireAdmin();

  if (!hasGalleryInviteConfig()) {
    return {
      ok: false,
      message:
        "Email not configured. Set RESEND_API_KEY and SELECTS_NOTIFICATION_FROM in your environment.",
    };
  }

  const cfg = getGalleryInviteConfig();
  if (!cfg.apiKey || !cfg.from) {
    return { ok: false, message: "Email configuration is incomplete." };
  }

  const gallery = await getAdminGallery(galleryId);
  if (!gallery) {
    return { ok: false, message: "Gallery not found." };
  }

  const recipient = (input.recipient ?? gallery.client_email ?? "").trim();
  if (!recipient) {
    return {
      ok: false,
      message: "No recipient email. Add a client email or type one in the Send to client box.",
    };
  }
  if (!isValidEmail(recipient)) {
    return { ok: false, message: `"${recipient}" is not a valid email address.` };
  }

  const subject = input.subject?.trim() || null;
  const message = input.message?.trim() || null;
  const includePassword = input.includePassword ?? true;

  const galleryUrl = `https://nhihadhassan.ca/galleries/${gallery.slug}`;
  const coverImageUrl = await getGalleryEmailCoverUrl(gallery);

  const email = buildGalleryInviteEmail({
    clientName: gallery.client_name,
    galleryTitle: gallery.title,
    galleryUrl,
    password: includePassword ? (gallery.password_plain ?? null) : null,
    photographerEmail: brandConfig.contactEmail,
    coverImageUrl,
    subject,
    message,
  });

  const supabase = await createSupabaseServerClient();
  let resendMessageId: string | null = null;

  try {
    const client = new Resend(cfg.apiKey);
    const result = await client.emails.send({
      from: cfg.from,
      to: recipient,
      replyTo: brandConfig.contactEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (result.error) {
      return {
        ok: false,
        message: `Send failed: ${result.error.message ?? result.error.name ?? "unknown error"}`,
      };
    }

    resendMessageId = result.data?.id ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { ok: false, message: `Send threw: ${message}` };
  }

  // Persist the composed wording so a resend keeps it. Non-fatal if it fails.
  try {
    await supabase
      .from("galleries")
      .update({ invite_subject: subject, invite_message: message })
      .eq("id", galleryId);
  } catch (saveErr) {
    console.warn("[gallery-invite] draft save failed:", saveErr);
  }

  // Log the send — non-fatal if it fails.
  try {
    await supabase.from("gallery_invite_log").insert({
      gallery_id: galleryId,
      sent_to: recipient,
      resend_message_id: resendMessageId,
    });
  } catch (logErr) {
    console.warn("[gallery-invite] log insert failed:", logErr);
  }

  revalidatePath(`/admin/galleries/${galleryId}/share`);
  revalidatePath(`/admin/galleries/${galleryId}`);

  return { ok: true, message: `Invite sent to ${recipient}.` };
}
