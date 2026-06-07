import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/bookings";
import { siteUrl } from "@/lib/seo";
import { BookingRowActions } from "@/components/booking-row-actions";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

function formatStart(iso: string | null) {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

function Chip({ children, tone }: { children: string; tone: "ok" | "muted" | "info" }) {
  const cls =
    tone === "ok"
      ? "border-admin-success/30 bg-admin-success/10 text-admin-success"
      : tone === "info"
        ? "border-admin-info/30 bg-admin-info/10 text-admin-info"
        : "border-admin-ink/15 text-admin-ink/50";
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export default async function AdminBookingsPage() {
  await requireAdmin();
  const bookings = await getAdminBookings();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
            <CalendarClock className="size-5 text-admin-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-admin-accent">Bookings</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bookings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
              Create a booking hub for each client: a single link with the shoot date, an add-to-calendar
              invite, deposit and contract status, and their gallery when it is ready.
            </p>
          </div>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface"
        >
          <Plus className="size-4" aria-hidden="true" />
          New booking
        </Link>
      </div>

      {bookings.length ? (
        <div className="mt-8 grid gap-3">
          {bookings.map((b) => {
            const hubUrl = `${origin}/booking/${b.token}`;
            return (
              <article key={b.id} className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-semibold tracking-tight hover:text-admin-accent"
                      >
                        {b.client_name ?? b.shoot_type ?? "Booking"}
                      </Link>
                      {b.agreement?.signed_at ? <Chip tone="ok">Signed</Chip> : null}
                      {b.gallery?.is_published ? <Chip tone="info">Gallery live</Chip> : null}
                    </div>
                    <p className="mt-1 text-sm text-admin-ink/55">
                      {b.shoot_type ? `${b.shoot_type} · ` : ""}
                      {formatStart(b.start_at)}
                      {b.location ? ` · ${b.location}` : ""}
                    </p>
                  </div>
                  <BookingRowActions id={b.id} hubUrl={hubUrl} hasCalendar={Boolean(b.start_at)} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 rounded-md border border-dashed border-admin-ink/15 px-4 py-10 text-center text-sm text-admin-ink/50">
          No bookings yet. Click “New booking” to create one.
        </p>
      )}
    </div>
  );
}
