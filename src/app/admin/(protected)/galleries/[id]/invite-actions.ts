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
  /** One or more recipient emails, separated by commas, semicolons, or new lines. */
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

const MAX_RECIPIENTS = 20;

function parseRecipients(value: string): { recipients: string[] } | { error: string } {
  const recipients = [...new Set(
    value
      .split(/[,;\n]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )];

  if (!recipients.length) {
    return { error: "No recipient email. Add a client email or type one in the Send to client box." };
  }

  if (recipients.length > MAX_RECIPIENTS) {
    return { error: `You can send to a maximum of ${MAX_RECIPIENTS} recipients at once.` };
  }

  const invalid = recipients.filter((email) => !isValidEmail(email));
  if (invalid.length) {
    return {
      error: `These email addresses are not valid: ${invalid.join(", ")}.`,
    };
  }

  return { recipients };
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

  const recipientInput = (input.recipient ?? gallery.client_email ?? "").trim();
  const parsedRecipients = parseRecipients(recipientInput);
  if ("error" in parsedRecipients) {
    return { ok: false, message: parsedRecipients.error };
  }
  const recipients = parsedRecipients.recipients;

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
  const apiKey = cfg.apiKey;
  const from = cfg.from;
  const client = new Resend(apiKey);
  const sendResults = await Promise.all(
    recipients.map(async (recipient) => {
      try {
        const result = await client.emails.send({
          from,
          to: recipient,
          replyTo: brandConfig.contactEmail,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });

        if (result.error) {
          return {
            recipient,
            ok: false,
            messageId: null,
            error: result.error.message ?? result.error.name ?? "unknown error",
          };
        }

        return { recipient, ok: true, messageId: result.data?.id ?? null };
      } catch (err) {
        return {
          recipient,
          ok: false,
          messageId: null,
          error: err instanceof Error ? err.message : "unknown error",
        };
      }
    }),
  );

  const sent = sendResults.filter((result) => result.ok);
  const failed = sendResults.filter((result) => !result.ok);
  if (sent.length === 0) {
    return {
      ok: false,
      message: `Send failed: ${failed.map((result) => `${result.recipient} (${result.error})`).join(", ")}`,
    };
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
  for (const result of sent) {
    try {
      await supabase.from("gallery_invite_log").insert({
        gallery_id: galleryId,
        sent_to: result.recipient,
        resend_message_id: result.messageId,
      });
    } catch (logErr) {
      console.warn("[gallery-invite] log insert failed:", logErr);
    }
  }

  revalidatePath(`/admin/galleries/${galleryId}/share`);
  revalidatePath(`/admin/galleries/${galleryId}`);

  if (failed.length) {
    return {
      ok: false,
      message: `Sent to ${sent.length} recipient${sent.length === 1 ? "" : "s"}. Failed for ${failed.map((result) => result.recipient).join(", ")}.`,
    };
  }

  return {
    ok: true,
    message:
      sent.length === 1
        ? `Invite sent to ${sent[0].recipient}.`
        : `Invite sent to ${sent.length} recipients.`,
  };
}
