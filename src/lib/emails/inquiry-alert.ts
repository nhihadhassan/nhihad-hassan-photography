/**
 * The photographer's "new inquiry" alert.
 *
 * Pure like shell.ts (no "server-only"), so the same markup can be rendered for
 * review without going through the mail provider.
 */
import { emailShell, escapeHtml } from "@/lib/emails/shell";

export type InquiryAlertInput = {
  name: string;
  email: string;
  phone?: string | null;
  eventType?: string | null;
  packageName?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  budget?: string | null;
  message: string;
};

/** The inquiry alert's subject and body, split out so it can be rendered and reviewed without sending. */
export function buildInquiryAdminAlert(input: InquiryAlertInput): { subject: string; html: string; text: string } {
  // Every label cell declares the same width. Leaving it off even one row lets
  // the client recompute the column and stretch it, which is what opened a gap
  // wide enough to squeeze the values off the side of a phone screen.
  const LABEL_CELL =
    "padding:6px 12px 6px 0;width:84px;vertical-align:top;color:rgba(23,19,15,0.55);";
  const VALUE_CELL =
    "padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;";
  const linkStyle = "color:#9b744f;text-decoration:none;word-break:break-word;";
  const rowHtml = (label: string, valueHtml: string | null | undefined) =>
    valueHtml
      ? `<tr><td style="${LABEL_CELL}">${escapeHtml(label)}</td><td style="${VALUE_CELL}">${valueHtml}</td></tr>`
      : "";
  const row = (label: string, value: string | null | undefined) =>
    rowHtml(label, value ? escapeHtml(value) : null);

  const telHref = input.phone?.replace(/[^\d+]/g, "");
  const phoneHtml = input.phone && telHref
    ? `<a href="tel:${escapeHtml(telHref)}" style="${linkStyle}">${escapeHtml(input.phone)}</a>`
    : null;

  const bodyHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;font-size:15px;line-height:1.5;table-layout:fixed;">
      ${row("Name", input.name)}
      ${rowHtml("Email", `<a href="mailto:${escapeHtml(input.email)}" style="${linkStyle}">${escapeHtml(input.email)}</a>`)}
      ${rowHtml("Phone", phoneHtml)}
      ${row("Type", input.eventType)}
      ${row("Package", input.packageName)}
      ${row("Date", input.eventDate)}
      ${row("Time", input.eventTime)}
      ${row("Location", input.location)}
      ${row("Budget", input.budget)}
    </table>
    <p style="margin:22px 0 6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(23,19,15,0.55);">Message</p>
    <div style="padding:14px 16px;background:#f3eee5;border:1px solid rgba(23,19,15,0.10);border-radius:6px;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;font-size:15px;line-height:1.6;color:${"rgba(23,19,15,0.88)"};">${escapeHtml(input.message)}</div>
    <p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;color:rgba(23,19,15,0.65);">
      Reply to this email to answer ${escapeHtml(input.name.trim().split(/\s+/)[0] || "them")} directly.
    </p>`;
  return {
    subject: `New inquiry from ${input.name}`,
    text: `New inquiry\n\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone ?? "-"}\nType: ${input.eventType ?? "-"}\nPackage: ${input.packageName ?? "-"}\nDate: ${input.eventDate ?? "-"}\nTime: ${input.eventTime ?? "-"}\nLocation: ${input.location ?? "-"}\nBudget: ${input.budget ?? "-"}\n\nMessage:\n${input.message}`,
    html: emailShell({ eyebrow: "New inquiry", heading: `${input.name} got in touch.`, bodyHtml }),
  };
}
