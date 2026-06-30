import "server-only";
import { Resend } from "resend";
import { getGalleryInviteConfig, hasGalleryInviteConfig } from "@/lib/env";
import { env } from "@/lib/env";
import { brandConfig } from "@/lib/config";
import { emailShell, escapeHtml } from "@/lib/emails/shell";

type SendResult = { ok: boolean; message: string };

/** Core send. Best-effort: returns ok:false (never throws) when unconfigured. */
async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
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
    const result = await client.emails.send({
      from: cfg.from,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    if (result.error) {
      return { ok: false, message: result.error.message ?? result.error.name ?? "Send failed." };
    }
    return { ok: true, message: `Email sent to ${opts.to}.` };
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
export async function sendInquiryAdminAlert(input: {
  name: string;
  email: string;
  phone?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  location?: string | null;
  budget?: string | null;
  message: string;
}): Promise<SendResult> {
  const row = (label: string, value: string | null | undefined) =>
    value ? `<tr><td style="padding:5px 0;color:rgba(23,19,15,0.55);width:110px;">${escapeHtml(label)}</td><td style="padding:5px 0;">${escapeHtml(value)}</td></tr>` : "";
  const bodyHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;line-height:1.5;">
      ${row("Name", input.name)}
      <tr><td style="padding:5px 0;color:rgba(23,19,15,0.55);">Email</td><td style="padding:5px 0;"><a href="mailto:${escapeHtml(input.email)}" style="color:#9b744f;text-decoration:none;">${escapeHtml(input.email)}</a></td></tr>
      ${row("Phone", input.phone)}
      ${row("Type", input.eventType)}
      ${row("Date", input.eventDate)}
      ${row("Location", input.location)}
      ${row("Budget", input.budget)}
    </table>
    <p style="margin:16px 0 6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(23,19,15,0.55);">Message</p>
    <div style="padding:14px 16px;background:#ffffff;border:1px solid rgba(23,19,15,0.08);border-radius:4px;white-space:pre-wrap;">${escapeHtml(input.message)}</div>`;
  return sendMail({
    to: adminRecipient(),
    replyTo: input.email,
    subject: `New inquiry from ${input.name}`,
    text: `New inquiry\n\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone ?? "-"}\nType: ${input.eventType ?? "-"}\nDate: ${input.eventDate ?? "-"}\nLocation: ${input.location ?? "-"}\nBudget: ${input.budget ?? "-"}\n\nMessage:\n${input.message}`,
    html: emailShell({ eyebrow: "New inquiry", heading: `${input.name} got in touch.`, bodyHtml }),
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

/**
 * On signing, email a confirmation/copy to the client and a notification to the
 * photographer. Best-effort: each send is independent and never throws.
 */
export async function sendSignedAgreementEmails(input: {
  signerName: string;
  clientEmail: string | null;
  url: string;
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
          bodyHtml: `<p style="margin:0 0 14px 0;">Hi ${escapeHtml(first)},</p><p style="margin:0 0 14px 0;">Thank you for signing your booking agreement with ${escapeHtml(brandConfig.name)}. You can view or print a copy anytime using the button below.</p>`,
          ctaLabel: "View your signed agreement",
          ctaUrl: input.url,
        }),
      }),
    );
  }

  tasks.push(
    sendMail({
      to: adminRecipient(),
      replyTo: input.clientEmail ?? undefined,
      subject: `${input.signerName} signed the agreement`,
      text: `${input.signerName} just signed their booking agreement. View it here:\n\n${input.url}`,
      html: emailShell({
        eyebrow: "Agreement signed",
        heading: `${input.signerName} signed.`,
        bodyHtml: `<p style="margin:0;">${escapeHtml(input.signerName)} just signed their booking agreement.</p>`,
        ctaLabel: "View the signed agreement",
        ctaUrl: input.url,
      }),
    }),
  );

  await Promise.allSettled(tasks);
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
