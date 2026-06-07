import { Workflow } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { PipelineBoard, type PipelineCard } from "@/components/pipeline-board";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

function shootDate(iso: string | null) {
  if (!iso) return "No date";
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
}

export default async function AdminPipelinePage() {
  await requireAdmin();
  const [bookings, payments] = await Promise.all([getAdminBookings(), listPayments()]);

  const paidByBooking = new Set(payments.filter((p) => p.booking_id).map((p) => p.booking_id as string));

  const cards: PipelineCard[] = bookings.map((b) => ({
    id: b.id,
    title: b.client_name ?? b.shoot_type ?? "Booking",
    subtitle: [b.shoot_type && b.client_name ? b.shoot_type : null, shootDate(b.start_at)].filter(Boolean).join(" · "),
    stage: b.stage,
    checklist: [
      { label: "Contract", done: Boolean(b.agreement?.signed_at) },
      { label: "Deposit", done: paidByBooking.has(b.id) || b.gallery?.deposit_status === "paid" || b.gallery?.deposit_status === "received" },
      { label: "Gallery", done: Boolean(b.gallery?.is_published) },
    ],
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <Workflow className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Pipeline</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Every booking by stage, from inquiry to reviewed. The check marks show what is done
            (contract signed, deposit received, gallery delivered). Use the arrows to move a job
            forward or back.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {cards.length ? (
          <PipelineBoard cards={cards} />
        ) : (
          <p className="rounded-md border border-dashed border-admin-ink/15 px-4 py-10 text-center text-sm text-admin-ink/50">
            No bookings yet. Create one in Bookings and it will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
