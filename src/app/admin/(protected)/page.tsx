import Link from "next/link";
import { Archive, FolderOpen, HardDrive, Inbox, Send } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardCounts, getAdminGalleries, getAdminInquiries } from "@/lib/admin-data";
import { formatCompactDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [counts, galleries, inquiries] = await Promise.all([
    getAdminDashboardCounts(),
    getAdminGalleries(),
    getAdminInquiries(),
  ]);

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
          <p className="text-sm font-medium text-[#9b744f]">Studio overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
            Real Supabase galleries and inquiries are connected. R2 storage and photo management come next.
          </p>
        </div>
        <Link
          href="/admin/galleries/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#17130f] px-4 text-sm font-medium text-[#fbf8f1]"
        >
          Create gallery
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#17130f]/58">{stat.label}</p>
                <Icon className="size-4 text-[#9b744f]" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight">{stat.value}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent galleries</h2>
            <Link href="/admin/galleries" className="text-sm font-medium text-[#9b744f] hover:text-[#17130f]">
              View all
            </Link>
          </div>
          {galleries.length ? (
            <div className="mt-5 divide-y divide-[#17130f]/10">
              {galleries.slice(0, 5).map((gallery) => (
                <Link
                  key={gallery.id}
                  href={`/admin/galleries/${gallery.id}`}
                  className="grid gap-1 py-4 text-sm transition hover:text-[#9b744f]"
                >
                  <span className="font-medium">{gallery.title}</span>
                  <span className="text-[#17130f]/55">
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
        <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent inquiries</h2>
            <HardDrive className="size-4 text-[#9b744f]" aria-hidden="true" />
          </div>
          {inquiries.length ? (
            <div className="mt-5 divide-y divide-[#17130f]/10">
              {inquiries.slice(0, 4).map((inquiry) => (
                <div key={inquiry.id} className="py-4 text-sm">
                  <p className="font-medium">{inquiry.name}</p>
                  <p className="mt-1 text-[#17130f]/55">
                    {inquiry.event_type ?? "Inquiry"} · {formatCompactDate(inquiry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[#17130f]/58">
              New inquiry submissions will show here after the contact form is connected to your Supabase project.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
