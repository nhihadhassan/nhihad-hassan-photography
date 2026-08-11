/**
 * Agreement (contract) invite email — pure builder.
 *
 * No "server-only": this runs on the server when sending and in the browser
 * for the admin's live Preview & Send composer, so both stay perfectly in
 * sync. Mirrors gallery-invite.ts's shape (default subject/message, override
 * params, messageToHtml) so the two editable-email flows in this admin work
 * the same way.
 */

import { emailShell, escapeHtml, messageToHtml } from "@/lib/emails/shell";
import { brandConfig } from "@/lib/config";

export type AgreementEmailInput = {
  /** Client first name or full name — used in the greeting. */
  clientName: string | null;
  agreementUrl: string;
  expiresAt?: string | null;
  /** Contact fields left blank on the contract (e.g. "phone number", "mailing address"). */
  missingFields?: string[];
  /** Subject override. Falls back to a clean default when blank. */
  subject?: string | null;
  /** Body message override. Falls back to a short friendly default when blank. */
  message?: string | null;
};

export type AgreementEmailContent = { subject: string; html: string; text: string };

function firstName(name: string | null): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}

function formatTorontoDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

/** Clean default subject — colon, never an em dash. */
export function defaultAgreementSubject(): string {
  return `Your photography agreement · ${brandConfig.name}`;
}

/** Short, natural default message. Plain sentences, no buzzwords. */
export function defaultAgreementMessage(clientName: string | null): string {
  const greeting = firstName(clientName);
  return [
    greeting ? `Hi ${greeting},` : "Hi,",
    "",
    `Your photography agreement with ${brandConfig.name} is ready to review and sign.`,
    "",
    "Please read the agreement carefully, confirm the booking details, and use the signature form at the bottom when you are ready.",
  ].join("\n");
}

/**
 * The exact subject and body of the contract email. Split out from the send so
 * the admin can preview and edit the real message before it goes to the
 * signers. The expiry deadline and missing-contact-field notices are always
 * appended automatically after the (optionally edited) message, the same way
 * the gallery invite always appends its password line -- that information
 * must stay accurate regardless of what the admin writes above it.
 */
export function buildAgreementEmail(input: AgreementEmailInput): AgreementEmailContent {
  const subject = input.subject?.trim() || defaultAgreementSubject();
  const message = input.message?.trim() || defaultAgreementMessage(input.clientName);

  const expiry = input.expiresAt ? formatTorontoDateTime(input.expiresAt) : null;
  const expiryHtml = expiry
    ? `<p style="margin:0 0 14px 0;">Please sign by <strong>${escapeHtml(expiry)}</strong>. After that time, the agreement will close automatically.</p>`
    : "";
  const expiryText = expiry
    ? `\n\nPlease sign by ${expiry}. After that time, the agreement will close automatically.`
    : "";

  const missingFields = (input.missingFields ?? []).filter(Boolean);
  const missingHtml = missingFields.length
    ? `<p style="margin:0 0 8px 0;">Please fill out:</p><ul style="margin:0 0 14px 0;padding-left:20px;">${missingFields
        .map((field) => `<li>Your ${escapeHtml(field)}</li>`)
        .join("")}</ul>`
    : "";
  const missingText = missingFields.length
    ? `\n\nPlease fill out:\n${missingFields.map((field) => `- Your ${field}`).join("\n")}`
    : "";

  const bodyHtml = `${messageToHtml(message)}${expiryHtml}${missingHtml}`;
  const text = `${message}${expiryText}${missingText}\n\n${input.agreementUrl}`;

  return {
    subject,
    text,
    html: emailShell({
      eyebrow: "Photography agreement",
      heading: "Your agreement is ready.",
      bodyHtml,
      ctaLabel: "Review and sign agreement",
      ctaUrl: input.agreementUrl,
    }),
  };
}
