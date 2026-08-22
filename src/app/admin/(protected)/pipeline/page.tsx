import { requireAdmin } from "@/lib/auth";
import { getAdminBookings, getOperationalBookingStage } from "@/lib/bookings";
import { getAdminInquiries } from "@/lib/inquiries";
import {
  INQUIRY_STATUS_LABELS,
  isTerminalInquiryStatus,
  needsReply,
} from "@/lib/inquiry-lifecycle";
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
      kind: "booking" as const,
      href: `/admin/bookings/${b.id}`,
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

/**
 * Open leads as pipeline cards, so the board starts where the work starts
 * rather than at the point a booking already exists. Terminal leads are left
 * out -- converted ones are already on the board as their booking, and lost
 * ones are finished with.
 */
function buildLeadCards(
  inquiries: Awaited<ReturnType<typeof getAdminInquiries>>,
): PipelineCard[] {
  const now = Date.now();
  return inquiries
    .filter((inquiry) => !isTerminalInquiryStatus(inquiry.status))
    .map((inquiry) => {
      const ageDays = Math.floor((now - new Date(inquiry.created_at).getTime()) / DAY);
      return {
        id: `inquiry-${inquiry.id}`,
        kind: "lead" as const,
        href: "/admin/inquiries",
        title: inquiry.name,
        packageLabel: inquiry.event_type ?? inquiry.package_name ?? "",
        shootLabel: inquiry.event_date ? shootDate(inquiry.event_date) : "No date",
        stage: "inquiry" as const,
        money: { label: INQUIRY_STATUS_LABELS[inquiry.status], tone: "neutral" as const },
        daysInStage: ageDays,
        // An unanswered lead going stale is the one thing on this board that
        // is losing money by sitting still.
        stale: needsReply(inquiry.status) && ageDays > 2,
        totalValue: 0,
        deliveryDueDate: null,
      };
    });
}

export default async function AdminPipelinePage() {
  await requireAdmin();
  const [bookings, payments, inquiries] = await Promise.all([
    getAdminBookings(),
    listPayments(),
    getAdminInquiries(),
  ]);

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  const cards = [...buildLeadCards(inquiries), ...buildCards(bookings, paidByBooking)];
  const packages = Array.from(
    new Set(cards.map((c) => c.packageLabel).filter(Boolean)),
  ).sort();

  return (
    <div className="mx-auto max-w-[100rem]">
      <header>
        <p className="text-sm font-medium text-admin-accent">Pipeline</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Every lead and booking by stage. Bookings advance themselves when a contract is signed, a
          deposit is recorded, or a gallery is published; drag or use the arrows to move one by
          hand. Leads sit in the first column until you convert them on the Inquiries page.
        </p>
      </header>

      <div className="mt-6">
        {cards.length ? (
          <PipelineBoard cards={cards} packages={packages} />
        ) : (
          <p className="rounded-xl border border-dashed border-admin-line-strong px-4 py-10 text-center text-sm text-admin-muted">
            Nothing in the pipeline yet. Inquiries land in the first column, and bookings appear
            once you create or convert one.
          </p>
        )}
      </div>
    </div>
  );
}
