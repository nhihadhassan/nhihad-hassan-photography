import { requireAdmin } from "@/lib/auth";
import { getAdminBookings, getOperationalBookingStage } from "@/lib/bookings";
import { listPayments } from "@/lib/finance";
import { parseAmount } from "@/lib/utils";
import { STAGE_STALE_DAYS } from "@/lib/booking-stages";
import { PipelineBoard, type PipelineCard } from "@/components/pipeline-board";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";
const DAY = 24 * 60 * 60 * 1000;

function shootDate(iso: string | null) {
  if (!iso) return "No date";
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
}

function torontoDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildCards(
  bookings: Awaited<ReturnType<typeof getAdminBookings>>,
  paidByBooking: Map<string, number>,
): PipelineCard[] {
  const now = Date.now();
  const today = torontoDateKey(new Date(now));
  return bookings.map((b) => {
    const total = parseAmount(b.total) ?? 0;
    const paid = paidByBooking.get(b.id) ?? 0;
    const balance = Math.max(0, total - paid);

    let money: PipelineCard["money"];
    if (total > 0 && balance <= 0.5) money = { label: "Paid", tone: "positive" };
    else if (paid > 0) money = { label: "Balance due", tone: "warning" };
    else money = { label: "No deposit", tone: "neutral" };

    const daysInStage = Math.floor((now - new Date(b.updated_at).getTime()) / DAY);
    const stage = getOperationalBookingStage(b);
    const threshold = STAGE_STALE_DAYS[stage];
    const stale = stage === "editing" && b.delivery_due_date
      ? b.delivery_due_date < today
      : threshold !== null && daysInStage > threshold;

    return {
      id: b.id,
      title: b.client_name ?? b.shoot_type ?? "Booking",
      packageLabel: b.shoot_type ?? "",
      shootLabel: shootDate(b.start_at),
      stage,
      money,
      daysInStage,
      stale,
      totalValue: total,
      deliveryDueDate: b.delivery_due_date,
    };
  });
}

export default async function AdminPipelinePage() {
  await requireAdmin();
  const [bookings, payments] = await Promise.all([getAdminBookings(), listPayments()]);

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  const cards = buildCards(bookings, paidByBooking);
  const packages = Array.from(
    new Set(cards.map((c) => c.packageLabel).filter(Boolean)),
  ).sort();

  return (
    <div className="mx-auto max-w-[100rem]">
      <header>
        <p className="text-sm font-medium text-admin-accent">Pipeline</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Every booking by stage. Cards advance themselves when a contract is signed, a deposit is
          recorded, or a gallery is published. Drag or use the arrows to move one by hand.
        </p>
      </header>

      <div className="mt-6">
        {cards.length ? (
          <PipelineBoard cards={cards} packages={packages} />
        ) : (
          <p className="rounded-xl border border-dashed border-admin-line-strong px-4 py-10 text-center text-sm text-admin-muted">
            No bookings yet. Create one in Bookings and it will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
