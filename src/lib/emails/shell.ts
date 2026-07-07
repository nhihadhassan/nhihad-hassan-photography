/**
 * Shared, framework-agnostic email building blocks.
 *
 * Pure (no "server-only") so the same shell can render both on the server (when
 * actually sending via Resend) and in the browser (for the admin's live preview
 * iframe). Keep this file dependency-light — it should never import server-only
 * modules.
 *
 * The look is intentionally plain and human: warm cream paper, a serif heading,
 * a single solid button, and quiet supporting text. No decorative dividers, no
 * icon bullet lists, no uppercase letter-spaced "eyebrows" shouting at the
 * reader — those tics are what made the old gallery invite read as machine
 * generated.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type EmailShellOptions = {
  /** Small quiet label above the heading (e.g. the sender name). Optional. */
  eyebrow?: string;
  heading: string;
  /** Pre-escaped HTML for the message body. */
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Optional photo shown full-width at the top of the card (e.g. gallery cover). */
  coverImageUrl?: string | null;
  /** Footer line under the card. Defaults to the brand name + city. */
  footerHtml?: string;
};

const PAPER = "#f3eee5";
const CARD = "#fbf8f1";
const INK = "#17130f";
const COPPER = "#9b744f";

/**
 * Full logo lockup (NH monogram + "Nhihad Hassan Photography"), shown on a dark
 * band at the top of every email. The artwork is light, so it needs the dark
 * background to read. Served from the live site's public/ folder, so the URL is
 * absolute and stable for email clients.
 */
const BRAND_LOGO_URL = "https://www.nhihadhassan.ca/logo-lockup.png";

/** Branded HTML shell matching the site: cream paper, serif heading, one button. */
export function emailShell({
  eyebrow,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  coverImageUrl,
  footerHtml,
}: EmailShellOptions): string {
  const cover = coverImageUrl
    ? `<tr><td style="padding:0;"><img src="${escapeHtml(coverImageUrl)}" alt="" width="560" style="display:block;width:100%;max-height:300px;object-fit:cover;border:0;outline:none;text-decoration:none;"></td></tr>`
    : "";

  const eyebrowHtml = eyebrow
    ? `<p style="margin:0 0 6px 0;font-size:13px;color:${COPPER};">${escapeHtml(eyebrow)}</p>`
    : "";

  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:24px 34px 30px 34px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${INK};color:${CARD};padding:13px 24px;border-radius:6px;font-size:15px;font-weight:500;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
        </td></tr>`
      : `<tr><td style="padding:6px 34px 30px 34px;"></td></tr>`;

  const footer =
    footerHtml ?? `Nhihad Hassan Photography &nbsp;·&nbsp; Toronto, Ontario`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${PAPER};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;background:${CARD};border-radius:10px;overflow:hidden;">
        <tr><td style="background:${INK};padding:26px 0;text-align:center;">
          <img src="${BRAND_LOGO_URL}" alt="Nhihad Hassan Photography" width="180" style="display:inline-block;width:180px;max-width:55%;height:auto;border:0;outline:none;text-decoration:none;">
        </td></tr>
        ${cover}
        <tr><td style="padding:30px 34px 4px 34px;">
          ${eyebrowHtml}
          <h1 style="margin:0;font-size:25px;line-height:1.2;font-weight:600;font-family:Georgia,'Times New Roman',serif;color:${INK};">${escapeHtml(heading)}</h1>
        </td></tr>
        <tr><td style="padding:14px 34px 0 34px;font-size:15px;line-height:1.65;color:rgba(23,19,15,0.80);">
          ${bodyHtml}
        </td></tr>
        ${cta}
      </table>
      <p style="margin:18px 0 0 0;font-size:12px;color:rgba(23,19,15,0.45);">${footer}</p>
    </td></tr>
  </table>
</body>
</html>`;
}
