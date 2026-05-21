import "server-only";
import { Resend } from "resend";
import { getSelectsEmailConfig, hasSelectsEmailConfig } from "@/lib/env";

let cachedClient: Resend | null = null;

function getClient(apiKey: string): Resend {
  if (cachedClient) return cachedClient;
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export type SelectsNotificationInput = {
  galleryTitle: string;
  gallerySlug: string;
  galleryId: string;
  visitorName: string | null;
  visitorEmail: string;
  notes: string | null;
  filenames: string[];
  submittedAt: Date;
  adminUrl: string;
};

const MAX_FILENAMES_IN_BODY = 50;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function buildSubject(input: SelectsNotificationInput): string {
  const who = input.visitorName?.trim() || input.visitorEmail;
  return `New selects from ${who} — ${input.galleryTitle}`;
}

function buildPlainText(input: SelectsNotificationInput): string {
  const filenamesShown = input.filenames.slice(0, MAX_FILENAMES_IN_BODY);
  const more = input.filenames.length - filenamesShown.length;

  const lines: string[] = [
    `New client selects submitted for "${input.galleryTitle}".`,
    "",
    `Visitor: ${input.visitorName ?? "(no name)"}`,
    `Email:   ${input.visitorEmail}`,
    `Sent:    ${formatTimestamp(input.submittedAt)}`,
    `Photos:  ${input.filenames.length}`,
  ];
  if (input.notes) {
    lines.push("");
    lines.push("Notes from visitor:");
    lines.push(input.notes);
  }
  lines.push("");
  lines.push("Selected filenames:");
  for (const f of filenamesShown) lines.push(`  - ${f}`);
  if (more > 0) lines.push(`  ...and ${more} more`);
  lines.push("");
  lines.push(`Review in admin: ${input.adminUrl}`);
  return lines.join("\n");
}

function buildHtml(input: SelectsNotificationInput): string {
  const filenamesShown = input.filenames.slice(0, MAX_FILENAMES_IN_BODY);
  const more = input.filenames.length - filenamesShown.length;
  const visitor = input.visitorName?.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(buildSubject(input))}</title></head>
<body style="margin:0;padding:0;background:#f3eee5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#17130f;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3eee5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#fbf8f1;border:1px solid rgba(23,19,15,0.08);border-radius:6px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#9b744f;">New client selects</p>
          <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.2;font-weight:600;">${escapeHtml(input.galleryTitle)}</h1>
        </td></tr>
        <tr><td style="padding:16px 32px 0 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;line-height:1.5;color:#17130f;">
            <tr>
              <td style="padding:6px 0;color:rgba(23,19,15,0.55);width:90px;">Visitor</td>
              <td style="padding:6px 0;">${escapeHtml(visitor || "(no name)")}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:rgba(23,19,15,0.55);">Email</td>
              <td style="padding:6px 0;"><a href="mailto:${escapeHtml(input.visitorEmail)}" style="color:#9b744f;text-decoration:none;">${escapeHtml(input.visitorEmail)}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:rgba(23,19,15,0.55);">Sent</td>
              <td style="padding:6px 0;">${escapeHtml(formatTimestamp(input.submittedAt))}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:rgba(23,19,15,0.55);">Photos</td>
              <td style="padding:6px 0;font-weight:600;">${input.filenames.length}</td>
            </tr>
          </table>
        </td></tr>
        ${input.notes ? `
        <tr><td style="padding:16px 32px 0 32px;">
          <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(23,19,15,0.55);">Notes from visitor</p>
          <div style="padding:14px 16px;background:#ffffff;border:1px solid rgba(23,19,15,0.08);border-radius:4px;font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(input.notes)}</div>
        </td></tr>` : ""}
        <tr><td style="padding:16px 32px 0 32px;">
          <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(23,19,15,0.55);">Selected filenames</p>
          <div style="padding:12px 16px;background:#ffffff;border:1px solid rgba(23,19,15,0.08);border-radius:4px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;line-height:1.7;color:rgba(23,19,15,0.85);">
            ${filenamesShown.map((f) => escapeHtml(f)).join("<br>")}
            ${more > 0 ? `<br><span style="color:rgba(23,19,15,0.5);">…and ${more} more</span>` : ""}
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px 28px 32px;">
          <a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#17130f;color:#fbf8f1;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:500;text-decoration:none;">Review in admin →</a>
        </td></tr>
      </table>
      <p style="margin:18px 0 0 0;font-size:11px;color:rgba(23,19,15,0.45);">Notification from your gallery — selects only, no images attached.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a selects-submission notification to the photographer. Never throws.
 * Best-effort: a missing API key or send failure logs a console warning and
 * returns silently so the visitor's submission isn't affected.
 */
export async function sendSelectsNotification(
  input: SelectsNotificationInput,
): Promise<{ sent: boolean; reason?: string }> {
  if (!hasSelectsEmailConfig()) {
    console.warn(
      "[selects-notification] skipped — RESEND_API_KEY / SELECTS_NOTIFICATION_TO / SELECTS_NOTIFICATION_FROM not configured.",
    );
    return { sent: false, reason: "not_configured" };
  }

  const cfg = getSelectsEmailConfig();
  if (!cfg.apiKey || !cfg.to || !cfg.from) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const client = getClient(cfg.apiKey);
    const result = await client.emails.send({
      from: cfg.from,
      to: cfg.to,
      replyTo: input.visitorEmail,
      subject: buildSubject(input),
      text: buildPlainText(input),
      html: buildHtml(input),
    });

    if (result.error) {
      console.warn(
        `[selects-notification] send failed: ${result.error.name ?? "unknown"} — ${result.error.message ?? ""}`,
      );
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.warn(`[selects-notification] send threw: ${message}`);
    return { sent: false, reason: "exception" };
  }
}
