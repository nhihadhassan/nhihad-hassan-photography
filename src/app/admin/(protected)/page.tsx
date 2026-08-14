import Link from "next/link";
import { CalendarPlus, FilePlus2, ReceiptText, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAttentionItems, getMoneyRow, type AttentionSeverity } from "@/lib/attention";
import { formatAge, formatMoney, parseAmount } from "@/lib/utils";
import { getAdminBookings, getOperationalBookingStage, type BookingWithLinks } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { fetchCalendarEvents } from "@/lib/google-calendar-events";
import { BOOKING_STAGES, BOOKING_STAGE_LABELS } from "@/lib/booking-stages";
import { siteUrl } from "@/lib/seo";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/schedule-calendar";
import { BookingsTable, type BookingRow } from "@/components/tables/bookings-table";

export const dynamic = "force-dynamic";

function currentTimeMs() {
  return Date.now();
}

const TZ = "America/Toronto";

const SEVERITY_DOT: Record<AttentionSeverity, string> = {
  danger: "bg-admin-status-danger",
  warning: "bg-admin-status-waiting",
  info: "bg-admin-status-info",
};

function todayLabel() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function torontoDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function matchBookingsToEvents(events: readonly { id: string; startIso: string }[], bookings: BookingWithLinks[]) {
  const direct = new Map(bookings.filter((b) => b.calendar_event_id).map((b) => [b.calendar_event_id as string, b]));
  const byDay = new Map<string, BookingWithLinks>();
  for (const booking of bookings) if (booking.start_at && !byDay.has(torontoDateKey(booking.start_at))) byDay.set(torontoDateKey(booking.start_at), booking);
  return new Map(events.flatMap((event) => {
    const booking = direct.get(event.id) ?? byDay.get(torontoDateKey(event.startIso));
    return booking ? [[event.id, booking] as const] : [];
  }));
}

function buildBookingRows(bookings: BookingWithLinks[], paidByBooking: Map<string, number>, origin: string): BookingRow[] {
  const now = Date.now();
  return bookings.map((booking) => {
    const total = parseAmount(booking.total) ?? 0;
    const paid = paidByBooking.get(booking.id) ?? 0;
    const balance = Math.max(0, total - paid);
    const stage = getOperationalBookingStage(booking);
    return {
      id: booking.id,
      client: booking.client_name ?? booking.shoot_type ?? "Booking",
      packageLabel: booking.shoot_type ?? "",
      shootIso: booking.start_at,
      stageLabel: BOOKING_STAGE_LABELS[stage],
      stageOrder: BOOKING_STAGES.indexOf(stage),
      moneyLabel: total > 0 && balance <= 0.5 ? "Paid" : paid > 0 ? "Balance due" : "No payment",
      moneyTone: total > 0 && balance <= 0.5 ? "positive" : paid > 0 ? "warning" : "neutral",
      isUpcoming: Boolean(booking.start_at && new Date(booking.start_at).getTime() >= now),
      hubUrl: `${origin}/booking/${booking.token}`,
      invoiceUrl: `${origin}/invoice/${booking.token}`,
      hasEmail: Boolean(booking.client_email),
      hasCalendar: Boolean(booking.start_at),
    };
  });
}

function eventDateTimeLabel(event: ScheduleEvent) {
  return event.allDay
    ? new Date(event.startIso).toLocaleDateString("en-CA", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" })
    : new Date(event.startIso).toLocaleString("en-CA", { timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function TodayPage() {
  await requireAdmin();

  const [money, attention, bookings, payments, calendarEvents] = await Promise.all([
    getMoneyRow(), getAttentionItems(), getAdminBookings(), listPayments(), fetchCalendarEvents(),
  ]);
  const events = calendarEvents ?? [];
  const matches = matchBookingsToEvents(events, bookings);
  const scheduleEvents: ScheduleEvent[] = events.map((event) => {
    const booking = matches.get(event.id);
    const stage = booking ? getOperationalBookingStage(booking) : null;
    return { ...event, bookingId: booking?.id ?? null, bookingStageLabel: stage ? BOOKING_STAGE_LABELS[stage] : null };
  });
  const now = currentTimeMs();
  const upcoming = scheduleEvents.filter((event) => new Date(event.endIso).getTime() >= now).slice(0, 6);
  const paidByBooking = new Map<string, number>();
  for (const payment of payments) if (payment.booking_id) paidByBooking.set(payment.booking_id, (paidByBooking.get(payment.booking_id) ?? 0) + payment.amount);
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const bookingRows = buildBookingRows(bookings, paidByBooking, origin);

  const moneyCards = [
    {
      label: "Collected this month",
      value: formatMoney(money.collectedThisMonth),
      sub: "Payments recorded",
      href: "/admin/finances",
    },
    {
      label: "Outstanding",
      value: formatMoney(money.outstandingTotal),
      sub: `${money.outstandingCount} ${money.outstandingCount === 1 ? "invoice" : "invoices"}`,
      href: "/admin/invoices",
    },
    {
      label: "Booked ahead",
      value: formatMoney(money.bookedAhead),
      sub: "Confirmed future work",
      href: "/admin#bookings",
    },
  ];

  const quickCreate = [
    { label: "New booking", href: "/admin/bookings/new", icon: CalendarPlus },
    { label: "New invoice", href: "/admin/invoices/new", icon: ReceiptText },
    { label: "New contract", href: "/admin/agreements", icon: FilePlus2 },
    { label: "New client", href: "/admin/clients", icon: UserPlus },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-admin-accent">Today</p>
        <h1 className="admin-display text-3xl text-admin-ink">{todayLabel()}</h1>
      </header>

      {/* Money row */}
      <section aria-label="Money" className="mt-6 grid gap-4 sm:grid-cols-3">
        {moneyCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-xl border border-admin-line bg-admin-surface p-5 transition hover:border-admin-line-strong"
          >
            <p className="text-sm text-admin-muted">{card.label}</p>
            <p className="admin-display mt-3 text-4xl tabular-nums text-admin-ink">{card.value}</p>
            <p className="mt-2 text-xs text-admin-muted">{card.sub}</p>
          </Link>
        ))}
      </section>

      {/* Needs attention */}
      <section aria-label="Needs attention" className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="admin-display text-xl text-admin-ink">Needs attention</h2>
          {attention.length > 0 ? (
            <span className="text-sm text-admin-muted tabular-nums">{attention.length}</span>
          ) : null}
        </div>

        {attention.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-admin-line-strong bg-admin-surface p-10 text-center">
            <p className="admin-display text-2xl text-admin-ink">Nothing needs you.</p>
            <p className="mt-1 text-sm text-admin-muted">Go shoot.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line bg-admin-surface">
            {attention.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-admin-subtle"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 size-2 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-admin-ink">{item.client}</p>
                  <p className="truncate text-sm text-admin-muted">{item.problem}</p>
                </div>
                {item.since ? (
                  <span className="hidden shrink-0 text-xs text-admin-muted tabular-nums sm:inline">
                    {formatAge(item.since)}
                  </span>
                ) : null}
                {item.action.external ? (
                  <a
                    href={item.action.href}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-admin-line-strong bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-ink hover:bg-admin-raise sm:min-h-9"
                  >
                    {item.action.label}
                  </a>
                ) : (
                  <Link
                    href={item.action.href}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-admin-line-strong bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-ink hover:bg-admin-raise sm:min-h-9"
                  >
                    {item.action.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="schedule" aria-labelledby="schedule-heading" className="mt-10 scroll-mt-24 border-t border-admin-line pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="schedule-heading" className="text-xl font-semibold tracking-tight text-admin-ink">Schedule</h2>
            <p className="mt-1 text-sm text-admin-muted">Google Calendar stays your live schedule. Start a contract from any event when it becomes real work.</p>
          </div>
          <Link href="/admin/agreements" className="text-sm font-medium text-admin-accent hover:text-admin-ink">New contract</Link>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <ScheduleCalendar events={scheduleEvents} />
          <aside className="h-fit border-t border-admin-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Next up</p>
            <div className="mt-3 divide-y divide-admin-line">
              {upcoming.length ? upcoming.map((event) => (
                <div key={event.id} className="py-3 first:pt-0">
                  <p className="text-sm font-medium text-admin-ink">{event.title}</p>
                  <p className="mt-0.5 text-xs text-admin-muted">{eventDateTimeLabel(event)}{event.tentative ? " · Tentative" : ""}</p>
                </div>
              )) : <p className="text-sm text-admin-muted">Nothing scheduled yet.</p>}
            </div>
          </aside>
        </div>
      </section>

      <section id="bookings" aria-labelledby="bookings-heading" className="mt-10 scroll-mt-24 border-t border-admin-line pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="bookings-heading" className="text-xl font-semibold tracking-tight text-admin-ink">Bookings</h2>
            <p className="mt-1 text-sm text-admin-muted">Sent contracts appear here automatically.</p>
          </div>
          <Link href="/admin/bookings/new" className="inline-flex min-h-10 items-center rounded-lg border border-admin-line-strong px-3 text-sm font-medium text-admin-ink hover:bg-admin-raise">Manual booking</Link>
        </div>
        <div className="mt-4"><BookingsTable rows={bookingRows} /></div>
      </section>

      {/* Quick create */}
      <section aria-label="Quick create" className="mt-8">
        <h2 className="text-sm font-medium text-admin-muted">Quick create</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickCreate.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-admin-line-strong bg-admin-surface px-4 text-sm font-medium text-admin-ink transition hover:bg-admin-raise sm:min-h-10"
              >
                <Icon className="size-4 text-admin-muted" aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
