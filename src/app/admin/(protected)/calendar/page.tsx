import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export default async function AdminCalendarPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Schedule</p>
        <h1 className="admin-display mt-2 text-3xl text-admin-ink">Calendar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Month and week views of shoots, holds, and blackout dates arrive in the calendar phase.
        </p>
      </div>
      <div className="mt-8">
        <EmptyState
          title="The calendar is on the way."
          description="You will see shoots, holds, and blackout dates on one view, with a side sheet to open a booking without leaving the page."
          action={
            <Link href="/admin/bookings" className="text-sm font-medium text-admin-accent hover:text-admin-ink">
              View bookings for now
            </Link>
          }
        />
      </div>
    </div>
  );
}
