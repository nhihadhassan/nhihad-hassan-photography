import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings, type BookingWithLinks } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { BOOKING_STAGES, BOOKING_STAGE_LABELS } from "@/lib/booking-stages";
import { fetchCalendarEvents } from "@/lib/google-calendar-events";
import { parseAmount } from "@/lib/utils";
import { siteUrl } from "@/lib/seo";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/schedule-calendar";
import { BookingsTable, type BookingRow } from "@/components/tables/bookings-table";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

function torontoDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/**
 * Matches each Google Calendar event to a booking sharing the same Toronto
 * calendar day, so clicking an event on the schedule can jump straight to
 * that booking's invoicing/stage workspace when one already exists.
 */
function matchBookingsToEvents(events: readonly { id: string; startIso: string }[], bookings: BookingWithLinks[]) {
  const byDay = new Map<string, BookingWithLinks>();
  for (const b of bookings) {
    if (!b.start_at) continue;
    const key = torontoDateKey(b.start_at);
    if (!byDay.has(key)) byDay.set(key, b);
  }
  const matches = new Map<string, BookingWithLinks>();
  for (const e of events) {
    const match = byDay.get(torontoDateKey(e.startIso));
    if (match) matches.set(e.id, match);
  }
  return matches;
}

function buildBookingRows(bookings: BookingWithLinks[], paidByBooking: Map<string, number>, origin: string): BookingRow[] {
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

function upcomingEvents(events: ScheduleEvent[], limit: number): ScheduleEvent[] {
  const now = Date.now();
  return events.filter((e) => new Date(e.endIso).getTime() >= now).slice(0, limit);
}

function eventDateTimeLabel(event: ScheduleEvent) {
  return event.allDay
    ? new Date(event.startIso).toLocaleDateString("en-CA", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" })
    : new Date(event.startIso).toLocaleString("en-CA", { timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function AdminSchedulePage() {
  await requireAdmin();
  const [bookings, payments, calendarEvents] = await Promise.all([
    getAdminBookings(),
    listPayments(),
    fetchCalendarEvents(),
  ]);

  const events = calendarEvents ?? [];
  const bookingMatches = matchBookingsToEvents(events, bookings);
  const scheduleEvents: ScheduleEvent[] = events.map((e) => {
    const match = bookingMatches.get(e.id);
    return {
      ...e,
      bookingId: match?.id ?? null,
      bookingStageLabel: match ? BOOKING_STAGE_LABELS[match.stage] : null,
    };
  });

  const upcoming = upcomingEvents(scheduleEvents, 8);

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const bookingRows = buildBookingRows(bookings, paidByBooking, origin);

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Schedule</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Schedule</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          {calendarEvents
            ? "Pulled live from your NHP Bookings Google Calendar. Add a session there and it shows up here automatically."
            : "Connect GOOGLE_CALENDAR_ICAL_URL to pull sessions in from your NHP Bookings Google Calendar."}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <ScheduleCalendar events={scheduleEvents} />
        </div>
        <aside className="h-fit rounded-xl border border-admin-line bg-admin-surface p-4 lg:sticky lg:top-[88px]">
          <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Next up</p>
          <div className="mt-3 space-y-3">
            {upcoming.length ? (
              upcoming.map((e) => (
                <div key={e.id} className="text-sm">
                  <p className="font-medium text-admin-ink">{e.title}</p>
                  <p className="text-xs text-admin-muted">
                    {eventDateTimeLabel(e)}
                    {e.tentative ? " · Tentative" : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-admin-muted">Nothing on the calendar yet.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-10 border-t border-admin-line pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="admin-display text-xl text-admin-ink">Bookings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
              Once a session on your calendar is ready for a contract or invoice, create a booking for
              it here to track stage and payments.
            </p>
          </div>
          <Link
            href="/admin/bookings/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface"
          >
            <Plus className="size-4" aria-hidden="true" />
            New booking
          </Link>
        </div>
        <div className="mt-6">
          <BookingsTable rows={bookingRows} />
        </div>
      </div>
    </div>
  );
}
