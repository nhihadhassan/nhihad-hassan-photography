import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminBookings } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { sendAgreementReminderEmail, sendReminderEmail } from "@/lib/notify-email";
import { logBookingEvent } from "@/lib/events";
import { getReminderRules, getMutedBookings, type ReminderKind } from "@/lib/reminder-rules";
import { parseAmount, formatMoney } from "@/lib/utils";
import { brandConfig } from "@/lib/config";
import { siteUrl } from "@/lib/seo";

export type { ReminderKind } from "@/lib/reminder-rules";

export type ReminderSummary = {
  enabled: boolean;
  sent: number;
  byKind: Record<ReminderKind, number>;
  contractSignature: number;
  expiredContracts: number;
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

async function expireDueAgreements(
  admin: ReturnType<typeof getServiceRoleSupabaseClient>,
  nowIso: string,
): Promise<number> {
  // A contract the client has already signed is waiting on the photographer,
  // so it must never expire out from under the pending countersignature.
  const { data, error } = await admin
    .from("agreement_requests")
    .update({ expired_at: nowIso, updated_at: nowIso })
    .is("signed_at", null)
    .is("revoked_at", null)
    .is("expired_at", null)
    .is("client_submitted_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", nowIso)
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

async function sendDueAgreementReminders(
  admin: ReturnType<typeof getServiceRoleSupabaseClient>,
  now: number,
): Promise<number> {
  const { data, error } = await admin
    .from("agreement_requests")
    .select("id,token,client_name,client_email,sent_at,expires_at,reminder_interval_days,reminder_max_sends,reminder_count,last_reminder_at")
    .eq("reminders_enabled", true)
    .is("signed_at", null)
    .is("revoked_at", null)
    .is("expired_at", null)
    .is("client_submitted_at", null)
    .not("sent_at", "is", null);
  if (error) throw new Error(error.message);

  let sent = 0;
  const base = origin();
  for (const row of data ?? []) {
    if (!row.client_email || !row.sent_at) continue;
    const count = Math.max(0, Number(row.reminder_count) || 0);
    const maxSends = Math.max(1, Number(row.reminder_max_sends) || 3);
    if (count >= maxSends) continue;

    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
    if (expiresAt && expiresAt <= now) continue;
    const anchor = new Date(row.last_reminder_at || row.sent_at).getTime();
    const intervalDays = Math.max(1, Number(row.reminder_interval_days) || 3);
    if (!Number.isFinite(anchor) || anchor + intervalDays * DAY > now) continue;

    const attemptAt = new Date(now).toISOString();
    await admin
      .from("agreement_requests")
      .update({ last_reminder_attempt_at: attemptAt, last_reminder_error: null, updated_at: attemptAt })
      .eq("id", row.id)
      .eq("reminder_count", count)
      .is("signed_at", null)
      .is("revoked_at", null)
      .is("expired_at", null)
      .is("client_submitted_at", null);

    const result = await sendAgreementReminderEmail({
      to: row.client_email,
      clientName: row.client_name,
      agreementUrl: `${base}/agreement/${row.token}`,
      expiresAt: row.expires_at,
      idempotencyKey: `agreement-reminder-${row.id}-${count + 1}`,
    });
    if (!result.ok) {
      await admin
        .from("agreement_requests")
        .update({ last_reminder_error: result.message, updated_at: attemptAt })
        .eq("id", row.id);
      continue;
    }

    const { error: updateError } = await admin
      .from("agreement_requests")
      .update({
        reminder_count: count + 1,
        last_reminder_at: attemptAt,
        last_reminder_attempt_at: attemptAt,
        last_reminder_error: null,
        last_reminder_message_id: result.messageId ?? null,
        updated_at: attemptAt,
      })
      .eq("id", row.id)
      .eq("reminder_count", count)
      .is("signed_at", null)
      .is("revoked_at", null)
      .is("expired_at", null)
      .is("client_submitted_at", null);
    if (!updateError) sent += 1;
  }
  return sent;
}

/**
 * Send any due reminder emails, deduplicated via reminder_log. Timing comes
 * from the editable reminder_rules (with safe defaults when the table is
 * absent). Best-effort per email. Does nothing unless reminders are enabled in
 * Settings. The legacy dedup key (kind:entity) is kept for the first send of
 * every kind, so applying the rules refactor never re-sends an already-sent
 * reminder; escalation sends use a suffixed key.
 */
export async function runReminders(): Promise<ReminderSummary> {
  const admin = getServiceRoleSupabaseClient();
  const byKind: Record<ReminderKind, number> = {
    deposit_due: 0,
    balance_due: 0,
    gallery_expiring: 0,
    review_request: 0,
  };

  const now = Date.now();
  const expiredContracts = await expireDueAgreements(admin, new Date(now).toISOString());

  const settings = await loadSettings(admin);
  if (!settings.reminders_enabled) {
    return { enabled: false, sent: 0, byKind, contractSignature: 0, expiredContracts };
  }

  const contractSignature = await sendDueAgreementReminders(admin, now);

  const [bookings, galleries, payments, logRes, rules, muted] = await Promise.all([
    getAdminBookings(),
    getAdminGalleries(),
    listPayments(),
    admin.from("reminder_log").select("kind,entity_id"),
    getReminderRules(),
    getMutedBookings(),
  ]);

  const sentSet = new Set((logRes.data ?? []).map((r) => `${r.kind}:${r.entity_id}`));
  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  const base = origin();

  // occurrence 0 keeps the legacy key so existing dedup still holds.
  const keyFor = (kind: ReminderKind, entityId: string, occurrence: number) =>
    occurrence === 0 ? `${kind}:${entityId}` : `${kind}:${entityId}:${occurrence}`;

  async function fire(
    kind: ReminderKind,
    entityId: string,
    occurrence: number,
    to: string,
    build: () => Parameters<typeof sendReminderEmail>[0],
    bookingId?: string,
  ) {
    const logKey = keyFor(kind, entityId, occurrence);
    if (sentSet.has(logKey)) return;
    const result = await sendReminderEmail(build());
    if (!result.ok) return;
    const { error } = await admin.from("reminder_log").insert({ kind, entity_id: logKey, sent_to: to });
    if (!error) {
      sentSet.add(logKey);
      byKind[kind] += 1;
      if (bookingId) {
        await logBookingEvent({ bookingId, type: "email", summary: `${labelFor(kind)} sent`, actor: "system" });
      }
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

    // Deposit due: booked, no payment yet, shoot upcoming. Escalates on a
    // cadence up to the rule cap, measured from when the booking was created.
    const depositRule = rules.deposit_due;
    if (
      depositRule.enabled &&
      !muted.has(`deposit_due:${b.id}`) &&
      b.stage === "booked" &&
      paid === 0 &&
      total &&
      total > 0 &&
      startMs &&
      startMs > now
    ) {
      const daysSince = Math.floor((now - new Date(b.created_at).getTime()) / DAY);
      if (daysSince >= depositRule.offset_days) {
        const occurrence = Math.floor((daysSince - depositRule.offset_days) / depositRule.cadence_days);
        if (occurrence < depositRule.max_sends) {
          const dep = b.deposit ? (b.deposit.startsWith("$") ? b.deposit : `$${b.deposit}`) : formatMoney(Math.round(total * 0.25));
          await fire("deposit_due", b.id, occurrence, b.client_email, () => ({
            to: b.client_email!,
            subject: `A quick reminder to hold your date`,
            eyebrow: "Deposit reminder",
            heading: "Let's lock in your date.",
            bodyText: `${greet}\n\nTo reserve your shoot date, please e-transfer the ${dep} deposit to ${brandConfig.contactEmail}. Your booking details are here: ${hubUrl}`,
            bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">To reserve your shoot date, please e-transfer the <strong>${dep}</strong> deposit to ${brandConfig.contactEmail}.</p>`,
            ctaLabel: "View your booking",
            ctaUrl: hubUrl,
          }), b.id);
        }
      }
    }

    // Balance due: shoot within the rule window, money still outstanding.
    const balanceRule = rules.balance_due;
    if (
      balanceRule.enabled &&
      !muted.has(`balance_due:${b.id}`) &&
      startMs &&
      startMs >= now &&
      startMs <= now + balanceRule.offset_days * DAY &&
      total &&
      total - paid > 0.5
    ) {
      const due = formatMoney(total - paid);
      await fire("balance_due", b.id, 0, b.client_email, () => ({
        to: b.client_email!,
        subject: `Your shoot is coming up`,
        eyebrow: "Balance reminder",
        heading: "Almost shoot day.",
        bodyText: `${greet}\n\nYour shoot is coming up. The remaining balance of ${due} is due on or before the shoot day, by e-transfer to ${brandConfig.contactEmail}. Details: ${hubUrl}`,
        bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">Your shoot is coming up. The remaining balance of <strong>${due}</strong> is due on or before the shoot day, by e-transfer to ${brandConfig.contactEmail}.</p>`,
        ctaLabel: "View your booking",
        ctaUrl: hubUrl,
      }), b.id);
    }

    // Review request: delivered, shoot was over the rule window ago.
    const reviewRule = rules.review_request;
    const reviewUrl = settings.google_review_url;
    if (
      reviewRule.enabled &&
      !muted.has(`review_request:${b.id}`) &&
      b.stage === "delivered" &&
      startMs &&
      startMs < now - reviewRule.offset_days * DAY &&
      reviewUrl
    ) {
      await fire("review_request", b.id, 0, b.client_email, () => ({
        to: b.client_email!,
        subject: `Hope you love your photos`,
        eyebrow: "A small favour",
        heading: "Would you leave a review?",
        bodyText: `${greet}\n\nI hope you love your gallery. If you have a minute, a Google review would mean a lot and helps future clients find me: ${reviewUrl}`,
        bodyHtml: `<p style="margin:0 0 14px 0;">${greet}</p><p style="margin:0 0 14px 0;">I hope you love your gallery. If you have a minute, a Google review would mean a lot and helps future clients find me.</p>`,
        ctaLabel: "Leave a Google review",
        ctaUrl: reviewUrl,
      }), b.id);
    }
  }

  // Gallery expiring: published, expiry within the rule window.
  const galleryRule = rules.gallery_expiring;
  if (galleryRule.enabled) {
    for (const g of galleries) {
      if (!g.client_email || !g.is_published || !g.expires_at) continue;
      const exp = new Date(g.expires_at).getTime();
      if (exp < now || exp > now + galleryRule.offset_days * DAY) continue;
      const galleryUrl = `${base}/galleries/${g.slug}`;
      const first = g.client_name?.trim().split(/\s+/)[0];
      const greet = first ? `Hi ${first},` : "Hello,";
      await fire("gallery_expiring", g.id, 0, g.client_email, () => ({
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
  }

  const sent = Object.values(byKind).reduce((a, b) => a + b, 0) + contractSignature;
  return { enabled: true, sent, byKind, contractSignature, expiredContracts };
}

function labelFor(kind: ReminderKind): string {
  switch (kind) {
    case "deposit_due":
      return "Deposit reminder";
    case "balance_due":
      return "Balance reminder";
    case "gallery_expiring":
      return "Gallery reminder";
    case "review_request":
      return "Review request";
  }
}
