import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/bookings";
import { BOOKING_STAGE_LABELS } from "@/lib/booking-stages";
import { AdminCalendar, type CalendarShoot } from "@/components/admin-calendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  await requireAdmin();
  const bookings = await getAdminBookings();

  const shoots: CalendarShoot[] = bookings
    .filter((b) => b.start_at)
    .map((b) => ({
      id: b.id,
      title: b.client_name ?? b.shoot_type ?? "Booking",
      startIso: b.start_at as string,
      packageLabel: b.shoot_type ?? "",
      location: b.location ?? "",
      stageLabel: BOOKING_STAGE_LABELS[b.stage],
    }));

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Schedule</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Calendar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Your shoots by month or week. Click one to open the booking without leaving the page.
        </p>
      </div>
      <div className="mt-6">
        <AdminCalendar shoots={shoots} />
      </div>
    </div>
  );
}
