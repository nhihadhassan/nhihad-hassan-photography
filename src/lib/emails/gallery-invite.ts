/**
 * Gallery invite email — pure builder.
 *
 * No "server-only": this runs on the server when sending and in the browser for
 * the admin's live preview, so both stay perfectly in sync. Tone is deliberately
 * human and plain (no em dashes, no icon bullets, no bordered "cards").
 */

import { emailShell, escapeHtml } from "@/lib/emails/shell";

export type GalleryInviteInput = {
  /** Client first name or full name — used in the greeting. */
  clientName: string | null;
  galleryTitle: string;
  /** Full public URL, e.g. https://nhihadhassan.ca/galleries/moove-ah */
  galleryUrl: string;
  /** Plain-text gallery password, or null to omit the password line. */
  password: string | null;
  /** Photographer contact email shown in the footer. */
  photographerEmail: string;
  /** Optional cover photo shown at the top of the email. */
  coverImageUrl?: string | null;
  /** Subject override. Falls back to a clean default when blank. */
  subject?: string | null;
  /** Body message override. Falls back to a short friendly default when blank. */
  message?: string | null;
};

function firstName(name: string | null): string | null {
  return name?.split(/\s+/)[0]?.trim() || null;
}

/** Clean default subject — colon, never an em dash. */
export function defaultInviteSubject(galleryTitle: string): string {
  return `Your gallery is ready: ${galleryTitle}`;
}

/** Short, natural default message. Plain sentences, no buzzwords. */
export function defaultInviteMessage(clientName: string | null): string {
  const greeting = firstName(clientName);
  return [
    greeting ? `Hi ${greeting},` : "Hi,",
    "",
    "Your photos are ready to view. Click the button below to open your gallery, favourite the ones you love, and download your selects whenever you are ready.",
    "",
    "If you have any questions, just reply to this email.",
  ].join("\n");
}

/** Turns a plain-text message (with blank-line paragraphs) into email-safe HTML. */
function messageToHtml(message: string): string {
  return message
    .trim()
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 14px 0;">${escapeHtml(para).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

export function buildGalleryInviteEmail(input: GalleryInviteInput): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = input.subject?.trim() || defaultInviteSubject(input.galleryTitle);
  const message = input.message?.trim() || defaultInviteMessage(input.clientName);

  // ── Plain text ────────────────────────────────────────────────────────────
  const textLines: string[] = [message, "", `View your gallery: ${input.galleryUrl}`];
  if (input.password) {
    textLines.push("", `Password: ${input.password}`);
  }
  textLines.push("", "Nhihad Hassan Photography", input.photographerEmail);
  const text = textLines.join("\n");

  // ── HTML ──────────────────────────────────────────────────────────────────
  const passwordLine = input.password
    ? `<p style="margin:0 0 14px 0;color:rgba(23,19,15,0.80);">Your gallery password is <strong style="color:#17130f;">${escapeHtml(input.password)}</strong>. You will be asked for it when you open the link.</p>`
    : "";

  const bodyHtml = `${messageToHtml(message)}${passwordLine}`;

  const html = emailShell({
    heading: input.galleryTitle,
    bodyHtml,
    ctaLabel: "View your gallery",
    ctaUrl: input.galleryUrl,
    coverImageUrl: input.coverImageUrl ?? null,
    footerHtml: `Nhihad Hassan Photography &nbsp;·&nbsp; Toronto, Ontario &nbsp;·&nbsp; <a href="mailto:${escapeHtml(input.photographerEmail)}" style="color:rgba(23,19,15,0.55);text-decoration:underline;">${escapeHtml(input.photographerEmail)}</a>`,
  });

  return { subject, text, html };
}
