"use server";

import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasGalleryInviteConfig, getGalleryInviteConfig } from "@/lib/env";
import { buildGalleryInviteEmail } from "@/lib/gallery-invite-email";
import { brandConfig } from "@/lib/config";
import { revalidatePath } from "next/cache";

export type InviteActionResult = {
  ok: boolean;
  message: string;
};

/**
 * Sends a branded gallery invite email to the client email address stored on
 * the gallery. Logs the send in gallery_invite_log so the admin UI can show
 * "last sent" info.
 *
 * Safe to call multiple times — it's a manual action, no rate limiting beyond
 * the admin UI warning. Resend handles delivery retries internally.
 */
export async function sendGalleryInvite(galleryId: string): Promise<InviteActionResult> {
  await requireAdmin();

  if (!hasGalleryInviteConfig()) {
    return {
      ok: false,
      message: "Email not configured. Set RESEND_API_KEY and SELECTS_NOTIFICATION_FROM in your environment.",
    };
  }

  const cfg = getGalleryInviteConfig();
  if (!cfg.apiKey || !cfg.from) {
    return { ok: false, message: "Email configuration is incomplete." };
  }

  // Fetch gallery including password_plain (service role bypasses RLS)
  const supabase = await createSupabaseServerClient();
  const { data: gallery, error: fetchError } = await supabase
    .from("galleries")
    .select("id,title,slug,client_name,client_email,password_plain,is_published,is_archived")
    .eq("id", galleryId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: `Could not fetch gallery: ${fetchError.message}` };
  }

  if (!gallery) {
    return { ok: false, message: "Gallery not found." };
  }

  if (!gallery.client_email) {
    return {
      ok: false,
      message: "This gallery has no client email address. Add one in the gallery settings first.",
    };
  }

  const galleryUrl = `https://nhihadhassan.ca/galleries/${gallery.slug}`;

  const { subject, text, html } = buildGalleryInviteEmail({
    clientName: gallery.client_name,
    galleryTitle: gallery.title,
    galleryUrl,
    password: gallery.password_plain ?? null,
    photographerEmail: brandConfig.contactEmail,
  });

  let resendMessageId: string | null = null;

  try {
    const client = new Resend(cfg.apiKey);
    const result = await client.emails.send({
      from: cfg.from,
      to: gallery.client_email,
      subject,
      text,
      html,
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

  // Log the send — non-fatal if it fails
  try {
    await supabase.from("gallery_invite_log").insert({
      gallery_id: galleryId,
      sent_to: gallery.client_email,
      resend_message_id: resendMessageId,
    });
  } catch (logErr) {
    console.warn("[gallery-invite] log insert failed:", logErr);
  }

  revalidatePath(`/admin/galleries/${galleryId}`);

  return {
    ok: true,
    message: `Invite sent to ${gallery.client_email}.`,
  };
}
