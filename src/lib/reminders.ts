import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminBookings } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { sendReminderEmail } from "@/lib/notify-email";
import { parseAmount, formatMoney } from "@/lib/utils";
import { brandConfig } from "@/lib/config";
import { siteUrl } from "@/lib/seo";

export type ReminderKind = "deposit_due" | "balance_due" | "gallery_expiring" | "review_request";

export type ReminderSummary = {
  enabled: boolean;
  sent: number;
  byKind: Record<ReminderKind, number>;
};

const DAY = 24 * 60 * 60 * 1000;

function origin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
}

type Settings = { reminders_enabled: boolean; google_review_url: string | null };

async function loadSettings(admin: ReturnType<typeof getServiceRoleSupabaseClient>): Promise<Settings> {
  const { data } = await admin
    .from("site_settings")
    .select("reminders_enabled,google_review_url")
    .limit(1)
    .maybeSingle();
  return {
    reminders_enabled: Boolean(data?.reminders_enabled),
    google_review_url: (data?.google_review_url as string | null) ?? null,
  };
}

/**
 * Send any due reminder emails, deduplicated via reminder_log. Best-effort per
 * email. Returns a summary. Does nothing unless reminders are enabled in Settings.
 */
export async function runReminders(): Promise<ReminderSummary> {
  const admin = getServiceRoleSupabaseClient();
  const byKind: Record<ReminderKind, number> = {
    deposit_due: 0,
    balance_due: 0,
    gallery_expiring: 0,
    review_request: 0,
  };

  const settings = await loadSettings(admin);
  if (!settings.reminders_enabled) return { enabled: false, sent: 0, byKind };

  const [bookings, galleries, payments, logRes] = await Promise.all([
    getAdminBookings(),
    getAdminGalleries(),
    listPayments(),
    admin.from("reminder_log").select("kind,entity_id"),
  ]);

  const sentSet = new Set((logRes.data ?? []).map((r) => `${r.kind}:${r.entity_id}`));
  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  const now = Date.now();
  const base = origin();

  async function fire(kind: ReminderKind, entityId: string, to: string, build: () => Parameters<typeof sendReminderEmail>[0]) {
    if (sentSet.has(`${kind}:${entityId}`)) return;
    const result = await sendReminderEmail(build());
    if (!result.ok) return;
    const { error } = await admin.from("reminder_log").insert({ kind, entity_id: entityId, sent_to: to });
    if (!error) {
      sentSet.add(`${kind}:${entityId}`);
      byKind[kind] += 1;
    }
  }

  for (const b of bookings) {
    if (!b.client_email) continue;
    const total = parseAmount(b.total);
    const paid = paidByBooking.get(b.id) ?? 0;
    const startMs = b.start_at ? new Date(b.start_at).getTime() : null;
    const hubUrl = `${base}/booking/${b.token}`;
    const first = b.client_name?.trim().split(/\s+/)[0];
    const greet = first ? `Hi ${first},` : "Hello,";

    // Deposit due: booked, no payment recorded yet, shoot still upcoming.
    if (b.stage === "booked" && paid === 0 && total && total > 0 && startMs && startMs > now) {
      const dep = b.deposit ? (b.deposit.startsWith("$") ? b.deposit : `$${b.deposit}`) : formatMoney(Math.round(total * 0.25));
      await fire("deposit_due", b.id, b.client_email, () => ({
        to: b.client_email!,
        subject: `A quick reminder to hold your date`,
        eyebrow: "Deposit reminder",
        heading: "Let's lock in your date.",
        bodyText: `${greet}\n\nTo reserve your shoot date, please e-transfer the ${dep} deposit to ${brandConfig.contactEmail}. Your booking details are here: ${hubUrl}`,
        bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">To reserve your shoot date, please e-transfer the <strong>${dep}</strong> deposit to ${brandConfig.contactEmail}.</p>`,
        ctaLabel: "View your booking",
        ctaUrl: hubUrl,
      }));
    }

    // Balance due: shoot within 4 days, money still outstanding.
    if (startMs && startMs >= now && startMs <= now + 4 * DAY && total && total - paid > 0.5) {
      const due = formatMoney(total - paid);
      await fire("balance_due", b.id, b.client_email, () => ({
        to: b.client_email!,
        subject: `Your shoot is coming up`,
        eyebrow: "Balance reminder",
        heading: "Almost shoot day.",
        bodyText: `${greet}\n\nYour shoot is coming up. The remaining balance of ${due} is due on or before the shoot day, by e-transfer to ${brandConfig.contactEmail}. Details: ${hubUrl}`,
        bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">Your shoot is coming up. The remaining balance of <strong>${due}</strong> is due on or before the shoot day, by e-transfer to ${brandConfig.contactEmail}.</p>`,
        ctaLabel: "View your booking",
        ctaUrl: hubUrl,
      }));
    }

    // Review request: delivered, shoot was over a week ago, review link configured.
    const reviewUrl = settings.google_review_url;
    if (b.stage === "delivered" && startMs && startMs < now - 7 * DAY && reviewUrl) {
      await fire("review_request", b.id, b.client_email, () => ({
        to: b.client_email!,
        subject: `Hope you love your photos`,
        eyebrow: "A small favour",
        heading: "Would you leave a review?",
        bodyText: `${greet}\n\nI hope you love your gallery. If you have a minute, a Google review would mean a lot and helps future clients find me: ${reviewUrl}`,
        bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">I hope you love your gallery. If you have a minute, a Google review would mean a lot and helps future clients find me.</p>`,
        ctaLabel: "Leave a Google review",
        ctaUrl: reviewUrl,
      }));
    }
  }

  // Gallery expiring: published, expiry within 7 days.
  for (const g of galleries) {
    if (!g.client_email || !g.is_published || !g.expires_at) continue;
    const exp = new Date(g.expires_at).getTime();
    if (exp < now || exp > now + 7 * DAY) continue;
    const galleryUrl = `${base}/galleries/${g.slug}`;
    const first = g.client_name?.trim().split(/\s+/)[0];
    const greet = first ? `Hi ${first},` : "Hello,";
    await fire("gallery_expiring", g.id, g.client_email, () => ({
      to: g.client_email!,
      subject: `Your gallery is expiring soon`,
      eyebrow: "Gallery reminder",
      heading: "Download before it expires.",
      bodyText: `${greet}\n\nYour gallery "${g.title}" will expire soon. Please download your full-resolution photos before then: ${galleryUrl}`,
      bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">Your gallery <strong>${g.title}</strong> will expire soon. Please download your full-resolution photos before then.</p>`,
      ctaLabel: "Open your gallery",
      ctaUrl: galleryUrl,
    }));
  }

  const sent = Object.values(byKind).reduce((a, b) => a + b, 0);
  return { enabled: true, sent, byKind };
}
