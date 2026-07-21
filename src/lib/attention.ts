import "server-only";
import { getAdminBookings } from "@/lib/bookings";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getAdminInquiries } from "@/lib/admin-data";
import { listPayments } from "@/lib/finance";
import { parseAmount } from "@/lib/utils";

export type AttentionSeverity = "danger" | "warning" | "info";

export type AttentionAction = {
  label: string;
  href: string;
  /** External mailto links open the mail client rather than navigating. */
  external?: boolean;
};

export type AttentionItem = {
  id: string;
  severity: AttentionSeverity;
  /** Who this concerns. */
  client: string;
  /** What is wrong, in the interface voice. */
  problem: string;
  /** Timestamp the "how long" age is measured from. */
  since: string | null;
  action: AttentionAction;
  /** Sort weight, higher is more urgent. */
  weight: number;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * The single prioritized needs-attention feed for the Today screen. Every item
 * is derived from a real query, not a widget. Because the schema has no reply
 * flag or invoice due date, "no reply" means an inquiry with no booking or
 * contract yet, and invoice timing is driven by the shoot date (the balance is
 * due on or before shoot day, matching the reminder engine).
 */
export async function getAttentionItems(): Promise<AttentionItem[]> {
  const [bookings, agreements, inquiries, payments] = await Promise.all([
    getAdminBookings(),
    getAdminAgreementRequests(),
    getAdminInquiries(),
    listPayments(),
  ]);

  const now = Date.now();
  const items: AttentionItem[] = [];

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  // Contracts sent but unsigned after 48 hours.
  for (const a of agreements) {
    if (a.signed_at || a.revoked_at || !a.sent_at) continue;
    const sentMs = new Date(a.sent_at).getTime();
    if (now - sentMs < 2 * DAY) continue;
    items.push({
      id: `contract-${a.id}`,
      severity: "warning",
      client: a.client_name ?? a.client_email ?? "A client",
      problem: a.viewed_at ? "Viewed the contract but has not signed" : "Contract sent, not opened yet",
      since: a.sent_at,
      action: { label: "Open", href: "/admin/agreements" },
      weight: 70,
    });
  }

  // Booking money and shoot timing.
  for (const b of bookings) {
    const total = parseAmount(b.total);
    const paid = paidByBooking.get(b.id) ?? 0;
    const outstanding = total !== null ? Math.max(0, total - paid) : 0;
    const startMs = b.start_at ? new Date(b.start_at).getTime() : null;
    const client = b.client_name ?? b.client_email ?? b.shoot_type ?? "A booking";

    // Invoice overdue: shoot has passed and money is still owed.
    if (outstanding > 0.5 && startMs && startMs < now) {
      items.push({
        id: `overdue-${b.id}`,
        severity: "danger",
        client,
        problem: "Balance still owed after the shoot",
        since: b.start_at,
        action: { label: "Open", href: `/admin/bookings/${b.id}` },
        weight: 100,
      });
    }

    // Invoice due within 7 days: money owed and shoot is imminent.
    if (outstanding > 0.5 && startMs && startMs >= now && startMs <= now + 7 * DAY) {
      items.push({
        id: `due-${b.id}`,
        severity: "warning",
        client,
        problem: "Balance due before the upcoming shoot",
        since: b.start_at,
        action: { label: "Open", href: `/admin/bookings/${b.id}` },
        weight: 60,
      });
    }

    // Shoot in next 7 days missing a signed contract or a deposit.
    if (startMs && startMs >= now && startMs <= now + 7 * DAY) {
      const signed = Boolean(b.agreement?.signed_at);
      const hasDeposit = paid > 0 || b.gallery?.deposit_status === "received" || b.gallery?.deposit_status === "paid";
      if (!signed || !hasDeposit) {
        const missing = !signed && !hasDeposit ? "a signed contract and a deposit" : !signed ? "a signed contract" : "a deposit";
        items.push({
          id: `readiness-${b.id}`,
          severity: "danger",
          client,
          problem: `Shoot within a week, still missing ${missing}`,
          since: b.start_at,
          action: { label: "Open", href: `/admin/bookings/${b.id}` },
          weight: 90,
        });
      }
    }

    // Gallery not delivered within 14 days of the shoot date.
    if (startMs && startMs < now - 14 * DAY && b.stage !== "delivered" && b.stage !== "reviewed") {
      const galleryLive = b.gallery?.is_published;
      if (!galleryLive) {
        items.push({
          id: `delivery-${b.id}`,
          severity: "warning",
          client,
          problem: "Gallery not delivered two weeks after the shoot",
          since: b.start_at,
          action: { label: "Open", href: `/admin/bookings/${b.id}` },
          weight: 50,
        });
      }
    }
  }

  // Inquiries with no booking or contract yet (the closest signal to "no reply").
  const bookingEmails = new Set(
    bookings.map((b) => b.client_email?.toLowerCase()).filter(Boolean) as string[],
  );
  const agreementEmails = new Set(
    agreements.map((a) => a.client_email?.toLowerCase()).filter(Boolean) as string[],
  );
  for (const inq of inquiries) {
    const email = inq.email?.toLowerCase();
    const createdMs = new Date(inq.created_at).getTime();
    // Only nag about recent, unconverted inquiries.
    if (now - createdMs > 30 * DAY) continue;
    if (email && (bookingEmails.has(email) || agreementEmails.has(email))) continue;
    items.push({
      id: `inquiry-${inq.id}`,
      severity: now - createdMs > 2 * DAY ? "warning" : "info",
      client: inq.name,
      problem: inq.event_type ? `New ${inq.event_type} inquiry, no reply yet` : "New inquiry, no reply yet",
      since: inq.created_at,
      action: { label: "Reply", href: `mailto:${inq.email}`, external: true },
      weight: now - createdMs > 2 * DAY ? 80 : 40,
    });
  }

  return items.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    const at = a.since ? new Date(a.since).getTime() : 0;
    const bt = b.since ? new Date(b.since).getTime() : 0;
    return at - bt;
  });
}

export type MoneyRow = {
  collectedThisMonth: number;
  outstandingTotal: number;
  outstandingCount: number;
  bookedAhead: number;
};

/**
 * The three money numbers for the Today masthead. Collected this month and
 * outstanding come from the finance ledger; booked ahead is the value of
 * confirmed future bookings (total minus what is already collected).
 */
export async function getMoneyRow(): Promise<MoneyRow> {
  const [bookings, payments] = await Promise.all([getAdminBookings(), listPayments()]);

  const monthPrefix = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  const month = `${monthPrefix.year}-${monthPrefix.month}`;

  const collectedThisMonth = payments
    .filter((p) => p.paid_on.startsWith(month))
    .reduce((s, p) => s + p.amount, 0);

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  const now = Date.now();
  let outstandingTotal = 0;
  let outstandingCount = 0;
  let bookedAhead = 0;
  for (const b of bookings) {
    const total = parseAmount(b.total);
    if (total === null || total <= 0) continue;
    const paid = paidByBooking.get(b.id) ?? 0;
    const outstanding = Math.max(0, total - paid);
    if (outstanding > 0.5) {
      outstandingTotal += outstanding;
      outstandingCount += 1;
    }
    const startMs = b.start_at ? new Date(b.start_at).getTime() : null;
    if (startMs && startMs >= now && b.stage !== "inquiry") {
      bookedAhead += outstanding;
    }
  }

  return { collectedThisMonth, outstandingTotal, outstandingCount, bookedAhead };
}
