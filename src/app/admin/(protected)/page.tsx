import Link from "next/link";
import { Archive, CalendarClock, FolderOpen, HardDrive, Inbox, PenLine, Send, Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardCounts, getAdminGalleries, getAdminInquiries } from "@/lib/admin-data";
import { getAdminBookings } from "@/lib/bookings";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getFinanceSummary } from "@/lib/finance";
import { formatCompactDate, formatMoney } from "@/lib/utils";

const TZ = "America/Toronto";

function shootDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [counts, galleries, inquiries, bookings, agreements, finance] = await Promise.all([
    getAdminDashboardCounts(),
    getAdminGalleries(),
    getAdminInquiries(),
    getAdminBookings(),
    getAdminAgreementRequests(),
    getFinanceSummary(),
  ]);

  const now = Date.now();
  const upcomingShoots = bookings
    .filter((b) => b.start_at && new Date(b.start_at).getTime() >= now)
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime());
  const unsignedContracts = agreements.filter((a) => !a.signed_at && !a.revoked_at).length;

  const cockpit = [
    { label: "Income this month", value: formatMoney(finance.incomeThisMonth), href: "/admin/finances", icon: Wallet, attention: false },
    { label: "Upcoming shoots", value: String(upcomingShoots.length), href: "/admin/bookings", icon: CalendarClock, attention: false },
    { label: "Unsigned contracts", value: String(unsignedContracts), href: "/admin/agreements", icon: PenLine, attention: unsignedContracts > 0 },
    { label: "Outstanding", value: formatMoney(finance.outstandingTotal), href: "/admin/finances", icon: Wallet, attention: finance.outstandingTotal > 0 },
    { label: "New inquiries", value: String(counts.inquiries), href: "/admin/inquiries", icon: Inbox, attention: false },
  ];

  const stats = [
    { label: "Total galleries", value: String(counts.galleries), icon: FolderOpen },
    { label: "Published", value: String(counts.published), icon: Send },
    { label: "Archived", value: String(counts.archived), icon: Archive },
    { label: "Inquiries", value: String(counts.inquiries), icon: Inbox },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-admin-accent">Studio overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            What needs your attention today, with quick links into bookings, contracts, and inquiries.
          </p>
        </div>
        <Link
          href="/admin/galleries/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface"
        >
          Create gallery
        </Link>
      </div>
      {/* Action cockpit */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cockpit.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={
                "rounded-md border p-5 transition hover:border-admin-ink/25 " +
                (card.attention
                  ? "border-admin-accent/40 bg-admin-copper/10"
                  : "border-admin-ink/10 bg-admin-surface")
              }
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-admin-ink/58">{card.label}</p>
                <Icon className={`size-4 ${card.attention ? "text-admin-accent" : "text-admin-ink/40"}`} aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Upcoming shoots detail */}
      {upcomingShoots.length ? (
        <section className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Upcoming shoots</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-admin-accent hover:text-admin-ink">
              All bookings
            </Link>
          </div>
          <div className="mt-4 divide-y divide-admin-ink/10">
            {upcomingShoots.slice(0, 5).map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:text-admin-accent">
                <span className="font-medium">{b.client_name ?? b.shoot_type ?? "Booking"}</span>
                <span className="text-admin-ink/55">
                  {shootDateTime(b.start_at!)}
                  {b.location ? ` · ${b.location}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-admin-ink/58">{stat.label}</p>
                <Icon className="size-4 text-admin-accent" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight">{stat.value}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-md border border-admin-ink/10 bg-admin-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent galleries</h2>
            <Link href="/admin/galleries" className="text-sm font-medium text-admin-accent hover:text-admin-ink">
              View all
            </Link>
          </div>
          {galleries.length ? (
            <div className="mt-5 divide-y divide-admin-ink/10">
              {galleries.slice(0, 5).map((gallery) => (
                <Link
                  key={gallery.id}
                  href={`/admin/galleries/${gallery.id}`}
                  className="grid gap-1 py-4 text-sm transition hover:text-admin-accent"
                >
                  <span className="font-medium">{gallery.title}</span>
                  <span className="text-admin-ink/55">
                    {formatCompactDate(gallery.event_date)} · {gallery.is_published ? "Published" : "Draft"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Create your first gallery."
                description="Start with a title, cover URL, and publish settings. Photo uploads arrive in Phase 3B."
              />
            </div>
          )}
        </section>
        <section className="rounded-md border border-admin-ink/10 bg-admin-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent inquiries</h2>
            <HardDrive className="size-4 text-admin-accent" aria-hidden="true" />
          </div>
          {inquiries.length ? (
            <div className="mt-5 divide-y divide-admin-ink/10">
              {inquiries.slice(0, 4).map((inquiry) => (
                <div key={inquiry.id} className="py-4 text-sm">
                  <p className="font-medium">{inquiry.name}</p>
                  <p className="mt-1 text-admin-ink/55">
                    {inquiry.event_type ?? "Inquiry"} · {formatCompactDate(inquiry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-admin-ink/58">
              New inquiry submissions will show here after the contact form is connected to your Supabase project.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
