import "server-only";
import { Resend } from "resend";
import { getGalleryInviteConfig, hasGalleryInviteConfig } from "@/lib/env";
import { env } from "@/lib/env";
import { brandConfig } from "@/lib/config";
import { emailShell, escapeHtml } from "@/lib/emails/shell";
import { buildInquiryAdminAlert, type InquiryAlertInput } from "@/lib/emails/inquiry-alert";

export type SendResult = { ok: boolean; message: string; messageId?: string };

function formatTorontoDateTime(iso: string): string {
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

/** Core send. Best-effort: returns ok:false (never throws) when unconfigured. */
async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
  tags?: Array<{ name: string; value: string }>;
  idempotencyKey?: string;
}): Promise<SendResult> {
  if (!hasGalleryInviteConfig()) {
    return {
      ok: false,
      message: "Email not configured. Set RESEND_API_KEY and SELECTS_NOTIFICATION_FROM.",
    };
  }
  const cfg = getGalleryInviteConfig();
  if (!cfg.apiKey || !cfg.from) return { ok: false, message: "Email configuration is incomplete." };

  try {
    const client = new Resend(cfg.apiKey);
    const result = await client.emails.send(
      {
        from: cfg.from,
        to: opts.to,
        replyTo: opts.replyTo,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        attachments: opts.attachments,
        tags: opts.tags,
      },
      opts.idempotencyKey
        ? { headers: { "Idempotency-Key": opts.idempotencyKey } }
        : undefined,
    );
    if (result.error) {
      return { ok: false, message: result.error.message ?? result.error.name ?? "Send failed." };
    }
    return {
      ok: true,
      message: `Email sent to ${opts.to}.`,
      messageId: result.data?.id,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Send threw." };
  }
}

function adminRecipient(): string {
  return env.SELECTS_NOTIFICATION_TO || brandConfig.contactEmail;
}

/** Confirmation sent to someone who submits the inquiry form. */
export async function sendInquiryAutoReply(input: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const first = input.name.trim().split(/\s+/)[0] || "there";
  const bodyHtml = `
    <p style="margin:0 0 14px 0;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 14px 0;">Thank you for reaching out to ${escapeHtml(brandConfig.name)}. Your inquiry has come through and I will get back to you personally, usually within a day or two.</p>
    <p style="margin:0 0 14px 0;">If we are a good fit, I will reply to confirm availability and the next steps, including a 25% deposit by Interac e-Transfer to hold your date.</p>
    <p style="margin:0;">Talk soon,<br>${escapeHtml(brandConfig.name)}</p>`;
  return sendMail({
    to: input.to,
    replyTo: brandConfig.contactEmail,
    subject: `Thanks for your inquiry · ${brandConfig.name}`,
    text: `Hi ${first},\n\nThank you for reaching out to ${brandConfig.name}. Your inquiry has come through and I will get back to you personally, usually within a day or two.\n\nIf we are a good fit, I will reply to confirm availability and next steps, including a 25% deposit by Interac e-Transfer to hold your date.\n\nTalk soon,\n${brandConfig.name}`,
    html: emailShell({ eyebrow: "Inquiry received", heading: "Thanks for reaching out.", bodyHtml }),
  });
}

/** Alert sent to the photographer when a new inquiry arrives. */
export async function sendInquiryAdminAlert(input: InquiryAlertInput): Promise<SendResult> {
  const content = buildInquiryAdminAlert(input);
  return sendMail({
    to: adminRecipient(),
    replyTo: input.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

/** Generic reminder email used by the daily scheduler. */
export async function sendReminderEmail(input: {
  to: string;
  subject: string;
  eyebrow: string;
  heading: string;
  bodyHtml: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<SendResult> {
  return sendMail({
    to: input.to,
    replyTo: brandConfig.contactEmail,
    subject: input.subject,
    text: input.bodyText,
    html: emailShell({
      eyebrow: input.eyebrow,
      heading: input.heading,
      bodyHtml: input.bodyHtml,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
    }),
  });
}

/** Plain, visibly-clickable copy of a link under the main CTA button, for clients whose mail client drops the button styling. */
function fallbackLinkHtml(url: string): string {
  return `<p style="margin:14px 0 0 0;font-size:13px;color:#6b6459;">If the button doesn't work, open this link:<br /><a href="${escapeHtml(url)}" style="color:#6b6459;text-decoration:underline;">${escapeHtml(url)}</a></p>`;
}

/**
 * On signing, email a confirmation/copy to the client and a notification to the
 * photographer. Best-effort: each send is independent and never throws.
 */
export async function sendSignedAgreementEmails(input: {
  signerName: string;
  clientEmail: string | null;
  /** Public /agreement/{token} URL. Never an /admin path. */
  url: string;
  /** Admin's own contract list, offered as a secondary link in the photographer's copy only. */
  adminUrl?: string;
}): Promise<void> {
  const tasks: Promise<SendResult>[] = [];

  if (input.clientEmail) {
    const first = input.signerName.trim().split(/\s+/)[0] || "there";
    tasks.push(
      sendMail({
        to: input.clientEmail,
        replyTo: brandConfig.contactEmail,
        subject: `Your signed booking agreement · ${brandConfig.name}`,
        text: `Hi ${first},\n\nThank you for signing your booking agreement with ${brandConfig.name}. You can view or print a copy anytime here:\n\n${input.url}\n\nLooking forward to working together.`,
        html: emailShell({
          eyebrow: "Agreement signed",
          heading: "Thanks for signing.",
          bodyHtml: `<p style="margin:0 0 14px 0;">Hi ${escapeHtml(first)},</p><p style="margin:0 0 14px 0;">Thank you for signing your booking agreement with ${escapeHtml(brandConfig.name)}. You can view or print a copy anytime using the button below.</p>${fallbackLinkHtml(input.url)}`,
          ctaLabel: "View your signed agreement",
          ctaUrl: input.url,
        }),
      }),
    );
  }

  const adminLinkHtml = input.adminUrl
    ? `<p style="margin:6px 0 0 0;font-size:13px;"><a href="${escapeHtml(input.adminUrl)}" style="color:#6b6459;text-decoration:underline;">Open in admin</a></p>`
    : "";
  tasks.push(
    sendMail({
      to: adminRecipient(),
      replyTo: input.clientEmail ?? undefined,
      subject: `${input.signerName} signed the agreement`,
      text: `${input.signerName} just signed their booking agreement.\n\nView client agreement: ${input.url}${input.adminUrl ? `\nOpen in admin: ${input.adminUrl}` : ""}`,
      html: emailShell({
        eyebrow: "Agreement signed",
        heading: `${input.signerName} signed.`,
        bodyHtml: `<p style="margin:0;">${escapeHtml(input.signerName)} just signed their booking agreement.</p>${adminLinkHtml}`,
        ctaLabel: "View client agreement",
        ctaUrl: input.url,
      }),
    }),
  );

  await Promise.allSettled(tasks);
}

/** Send a client their standalone agreement link for review and signature. */
export type AgreementEmailContent = { subject: string; html: string; text: string };

/**
 * The exact subject and body of the contract email. Split out from the send so
 * the admin can preview the real message before it goes to the signers.
 */
export function buildAgreementEmail(input: {
  clientName: string | null;
  agreementUrl: string;
  expiresAt?: string | null;
}): AgreementEmailContent {
  const first = input.clientName?.trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${escapeHtml(first)},` : "Hello,";
  const expiry = input.expiresAt ? formatTorontoDateTime(input.expiresAt) : null;
  const expiryHtml = expiry
    ? `<p style="margin:0 0 14px 0;">Please sign by <strong>${escapeHtml(expiry)}</strong>. After that time, the agreement will close automatically.</p>`
    : "";
  const expiryText = expiry
    ? `\n\nPlease sign by ${expiry}. After that time, the agreement will close automatically.`
    : "";
  const bodyHtml = `
    <p style="margin:0 0 14px 0;">${greeting}</p>
    <p style="margin:0 0 14px 0;">Your photography agreement with ${escapeHtml(brandConfig.name)} is ready to review and sign.</p>
    ${expiryHtml}
    <p style="margin:0;">Please read the agreement carefully, confirm the booking details, and use the signature form at the bottom when you are ready.</p>
    ${fallbackLinkHtml(input.agreementUrl)}`;
  return {
    subject: `Your photography agreement · ${brandConfig.name}`,
    text: `${first ? `Hi ${first},` : "Hello,"}\n\nYour photography agreement with ${brandConfig.name} is ready to review and sign.${expiryText}\n\n${input.agreementUrl}\n\nPlease read the agreement carefully and confirm the booking details before signing.`,
    html: emailShell({
      eyebrow: "Photography agreement",
      heading: "Your agreement is ready.",
      bodyHtml,
      ctaLabel: "Review and sign agreement",
      ctaUrl: input.agreementUrl,
    }),
  };
}

export async function sendAgreementEmail(input: {
  to: string;
  clientName: string | null;
  agreementUrl: string;
  idempotencyKey: string;
  expiresAt?: string | null;
}): Promise<SendResult> {
  const content = buildAgreementEmail(input);
  return sendMail({
    to: input.to,
    replyTo: brandConfig.contactEmail,
    subject: content.subject,
    text: content.text,
    html: content.html,
    tags: [{ name: "category", value: "agreement" }],
    idempotencyKey: input.idempotencyKey,
  });
}

/** Follow-up for an active agreement that is still awaiting a signature. */
export async function sendAgreementReminderEmail(input: {
  to: string;
  clientName: string | null;
  agreementUrl: string;
  expiresAt?: string | null;
  idempotencyKey: string;
}): Promise<SendResult> {
  const first = input.clientName?.trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${escapeHtml(first)},` : "Hello,";
  const expiry = input.expiresAt ? formatTorontoDateTime(input.expiresAt) : null;
  const expiryHtml = expiry
    ? `<p style="margin:0 0 14px 0;">This signing link closes on <strong>${escapeHtml(expiry)}</strong>.</p>`
    : "";
  const expiryText = expiry ? `\n\nThis signing link closes on ${expiry}.` : "";
  const bodyHtml = `
    <p style="margin:0 0 14px 0;">${greeting}</p>
    <p style="margin:0 0 14px 0;">A quick reminder that your photography agreement with ${escapeHtml(brandConfig.name)} is still waiting for your signature.</p>
    ${expiryHtml}
    <p style="margin:0;">You can review the details and sign using the button below.</p>
    ${fallbackLinkHtml(input.agreementUrl)}`;
  return sendMail({
    to: input.to,
    replyTo: brandConfig.contactEmail,
    subject: `Reminder: your photography agreement is waiting`,
    text: `${first ? `Hi ${first},` : "Hello,"}\n\nA quick reminder that your photography agreement with ${brandConfig.name} is still waiting for your signature.${expiryText}\n\nReview and sign here:\n${input.agreementUrl}`,
    html: emailShell({
      eyebrow: "Agreement reminder",
      heading: "Your signature is still needed.",
      bodyHtml,
      ctaLabel: "Review and sign agreement",
      ctaUrl: input.agreementUrl,
    }),
    tags: [{ name: "category", value: "agreement_reminder" }],
    idempotencyKey: input.idempotencyKey,
  });
}

/** Send a client their booking hub link (date, calendar invite, contract, invoice, gallery). */
export async function sendBookingHubEmail(input: {
  to: string;
  clientName: string | null;
  url: string;
}): Promise<SendResult> {
  const first = input.clientName?.trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${escapeHtml(first)},` : "Hello,";
  const bodyHtml = `
    <p style="margin:0 0 14px 0;">${greeting}</p>
    <p style="margin:0 0 14px 0;">Here is your booking page with ${escapeHtml(brandConfig.name)}. It has your shoot details, an add-to-calendar button, your agreement to sign, your invoice, and your gallery once it is ready.</p>
    <p style="margin:0;">Looking forward to it.</p>`;
  return sendMail({
    to: input.to,
    replyTo: brandConfig.contactEmail,
    subject: `Your booking with ${brandConfig.name}`,
    text: `${first ? `Hi ${first},` : "Hello,"}\n\nHere is your booking page with ${brandConfig.name}. It has your shoot details, an add-to-calendar button, your agreement to sign, your invoice, and your gallery once it is ready:\n\n${input.url}\n\nLooking forward to it.`,
    html: emailShell({
      eyebrow: "Your booking",
      heading: "Everything for your shoot.",
      bodyHtml,
      ctaLabel: "Open your booking page",
      ctaUrl: input.url,
    }),
  });
}

/** Send a standalone invoice email with a direct link and PDF attachment. */
export async function sendInvoiceEmail(input: {
  to: string;
  clientName: string | null;
  invoiceNumber: string;
  amountDue: string;
  invoiceUrl: string;
  pdf: Uint8Array;
}): Promise<SendResult> {
  const first = input.clientName?.trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${escapeHtml(first)},` : "Hello,";
  const bodyHtml = `
    <p style="margin:0 0 14px 0;">${greeting}</p>
    <p style="margin:0 0 14px 0;">Your invoice <strong>${escapeHtml(input.invoiceNumber)}</strong> is ready. The current balance is <strong>${escapeHtml(input.amountDue)}</strong>.</p>
    <p style="margin:0 0 14px 0;">A PDF copy is attached. You can also use the button below to view the live invoice, which will reflect payments as they are recorded.</p>
    <p style="margin:0;">Payment can be sent by Interac e-Transfer to ${escapeHtml(brandConfig.contactEmail)}.</p>`;
  return sendMail({
    to: input.to,
    replyTo: brandConfig.contactEmail,
    subject: `Invoice ${input.invoiceNumber} · ${brandConfig.name}`,
    text: `${first ? `Hi ${first},` : "Hello,"}\n\nYour invoice ${input.invoiceNumber} is ready. The current balance is ${input.amountDue}.\n\nA PDF copy is attached. You can also view the live invoice here:\n${input.invoiceUrl}\n\nPayment can be sent by Interac e-Transfer to ${brandConfig.contactEmail}.`,
    html: emailShell({
      eyebrow: "Invoice",
      heading: `Your invoice is ready.`,
      bodyHtml,
      ctaLabel: "View live invoice",
      ctaUrl: input.invoiceUrl,
    }),
    attachments: [
      {
        filename: `${input.invoiceNumber}.pdf`,
        content: Buffer.from(input.pdf),
      },
    ],
    tags: [
      { name: "category", value: "invoice" },
      { name: "invoice_number", value: input.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "_") },
    ],
  });
}
