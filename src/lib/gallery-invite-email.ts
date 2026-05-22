import "server-only";

export type GalleryInviteInput = {
  /** Client first name or full name — used in the greeting. */
  clientName: string | null;
  galleryTitle: string;
  /** Full public URL, e.g. https://nhihadhassan.ca/galleries/moove-ah */
  galleryUrl: string;
  /** Plain-text gallery password, or null if the gallery is open. */
  password: string | null;
  /** Photographer contact email shown in the footer. */
  photographerEmail: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildGalleryInviteEmail(input: GalleryInviteInput): {
  subject: string;
  text: string;
  html: string;
} {
  const greeting = input.clientName?.split(" ")[0]?.trim() || null;
  const subject = `Your gallery is ready — ${input.galleryTitle}`;

  // ── Plain text ────────────────────────────────────────────────────────────
  const textLines: string[] = [
    greeting ? `Hi ${greeting},` : "Hi,",
    "",
    `Your gallery is ready: ${input.galleryTitle}`,
    "",
    `View your gallery: ${input.galleryUrl}`,
  ];

  if (input.password) {
    textLines.push("", `Password: ${input.password}`);
  }

  textLines.push(
    "",
    "From inside your gallery you can:",
    "  • Browse all photos at full resolution",
    "  • Heart your favourites to send them to me",
    "  • Download your selected images",
    "",
    `Questions? Reply to this email or reach me at ${input.photographerEmail}`,
    "",
    "— Nhihad Hassan Photography",
  );

  const text = textLines.join("\n");

  // ── HTML ──────────────────────────────────────────────────────────────────
  // Email-safe dark theme. Ink (#080808) background, copper (#9b744f) accents,
  // soft-white (#f7f3ed) text. Uses tables for broad client compatibility.

  const passwordBlock = input.password
    ? `
    <tr><td style="padding:0 32px 24px 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
        style="background:#1a1612;border-radius:6px;border:1px solid rgba(247,243,237,0.10);">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9b744f;">Gallery password</p>
            <p style="margin:0;font-size:18px;font-weight:600;letter-spacing:0.06em;color:#f7f3ed;font-family:'Courier New',Courier,monospace;">${escapeHtml(input.password)}</p>
          </td>
        </tr>
      </table>
      <p style="margin:10px 0 0 0;font-size:12px;color:rgba(247,243,237,0.45);">You'll be asked for this when you open your gallery link.</p>
    </td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#f7f3ed;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
    style="background:#0d0b09;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560"
        style="max-width:560px;width:100%;background:#111009;border:1px solid rgba(247,243,237,0.08);border-radius:8px;overflow:hidden;">

        <!-- Header bar -->
        <tr>
          <td style="padding:28px 32px 20px 32px;border-bottom:1px solid rgba(247,243,237,0.08);">
            <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9b744f;">Nhihad Hassan Photography</p>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:32px 32px 24px 32px;">
            <p style="margin:0 0 10px 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(247,243,237,0.50);">Your gallery is ready</p>
            <h1 style="margin:0;font-size:28px;line-height:1.15;font-weight:600;color:#f7f3ed;">${escapeHtml(input.galleryTitle)}</h1>
            ${greeting ? `<p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:rgba(247,243,237,0.70);">Hi ${escapeHtml(greeting)}, your photos are ready to view and download.</p>` : `<p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:rgba(247,243,237,0.70);">Your photos are ready to view and download.</p>`}
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 28px 32px;">
            <a href="${escapeHtml(input.galleryUrl)}"
              style="display:inline-block;background:#9b744f;color:#f7f3ed;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">
              Open your gallery →
            </a>
          </td>
        </tr>

        <!-- Password (conditional) -->
        ${passwordBlock}

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid rgba(247,243,237,0.08);margin:0;"></td></tr>

        <!-- Instructions -->
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 14px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(247,243,237,0.45);">Inside your gallery</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding:6px 0;font-size:14px;line-height:1.5;color:rgba(247,243,237,0.75);">
                  <span style="color:#9b744f;margin-right:8px;">♡</span>Heart any photo to add it to your favourites list
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;line-height:1.5;color:rgba(247,243,237,0.75);">
                  <span style="color:#9b744f;margin-right:8px;">↓</span>Download your selected images when you're ready
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;line-height:1.5;color:rgba(247,243,237,0.75);">
                  <span style="color:#9b744f;margin-right:8px;">✉</span>Reply to this email with any questions
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px 32px;border-top:1px solid rgba(247,243,237,0.08);">
            <p style="margin:0;font-size:12px;color:rgba(247,243,237,0.35);">
              Nhihad Hassan Photography &middot; Toronto &middot;
              <a href="mailto:${escapeHtml(input.photographerEmail)}" style="color:rgba(247,243,237,0.35);text-decoration:underline;">${escapeHtml(input.photographerEmail)}</a>
            </p>
            <p style="margin:8px 0 0 0;font-size:11px;color:rgba(247,243,237,0.22);">
              You received this because your photographer shared a private gallery with you.
            </p>
          </td>
        </tr>

      </table>

      <p style="margin:20px 0 0 0;font-size:11px;color:rgba(247,243,237,0.25);text-align:center;">
        Gallery link: <a href="${escapeHtml(input.galleryUrl)}" style="color:rgba(247,243,237,0.25);">${escapeHtml(input.galleryUrl)}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
