import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { BOOKING_STAGES, BOOKING_STAGE_LABELS } from "@/lib/booking-stages";
import { parseAmount } from "@/lib/utils";
import { siteUrl } from "@/lib/seo";
import { BookingsTable, type BookingRow } from "@/components/tables/bookings-table";

export const dynamic = "force-dynamic";

function buildRows(
  bookings: Awaited<ReturnType<typeof getAdminBookings>>,
  paidByBooking: Map<string, number>,
  origin: string,
): BookingRow[] {
  const now = Date.now();
  return bookings.map((b) => {
    const total = parseAmount(b.total) ?? 0;
    const paid = paidByBooking.get(b.id) ?? 0;
    const balance = Math.max(0, total - paid);
    let moneyLabel = "No deposit";
    let moneyTone: BookingRow["moneyTone"] = "neutral";
    if (total > 0 && balance <= 0.5) {
      moneyLabel = "Paid";
      moneyTone = "positive";
    } else if (paid > 0) {
      moneyLabel = "Balance due";
      moneyTone = "warning";
    }
    const startMs = b.start_at ? new Date(b.start_at).getTime() : null;
    return {
      id: b.id,
      client: b.client_name ?? b.shoot_type ?? "Booking",
      packageLabel: b.shoot_type ?? "",
      shootIso: b.start_at,
      stageLabel: BOOKING_STAGE_LABELS[b.stage],
      stageOrder: BOOKING_STAGES.indexOf(b.stage),
      moneyLabel,
      moneyTone,
      isUpcoming: Boolean(startMs && startMs >= now),
      hubUrl: `${origin}/booking/${b.token}`,
      invoiceUrl: `${origin}/invoice/${b.token}`,
      hasEmail: Boolean(b.client_email),
      hasCalendar: Boolean(b.start_at),
    };
  });
}

export default async function AdminBookingsPage() {
  await requireAdmin();
  const [bookings, payments] = await Promise.all([getAdminBookings(), listPayments()]);
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }
  const rows = buildRows(bookings, paidByBooking, origin);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-admin-accent">Bookings</p>
          <h1 className="admin-display mt-1 text-3xl text-admin-ink">Bookings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
            Every client booking, with its shoot date, stage, and money at a glance. Open one to work
            the full file.
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface"
        >
          <Plus className="size-4" aria-hidden="true" />
          New booking
        </Link>
      </div>

      <div className="mt-8">
        <BookingsTable rows={rows} />
      </div>
    </div>
  );
}
