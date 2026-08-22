import { EmptyState } from "@/components/empty-state";
import { InquiryCard, type InquiryCardData } from "@/components/inquiry-card";
import { requireAdmin } from "@/lib/auth";
import { getAdminInquiries } from "@/lib/inquiries";
import { isTerminalInquiryStatus, needsReply } from "@/lib/inquiry-lifecycle";
import { formatCompactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  await requireAdmin();

  const inquiries = await getAdminInquiries();

  const cards: InquiryCardData[] = inquiries.map((inquiry) => ({
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    eventType: inquiry.event_type,
    packageName: inquiry.package_name,
    eventDate: inquiry.event_date ? formatCompactDate(inquiry.event_date) : null,
    eventTime: inquiry.event_time,
    location: inquiry.location,
    budget: inquiry.budget,
    referralSource: inquiry.referral_source,
    message: inquiry.message,
    createdLabel: formatCompactDate(inquiry.created_at),
    status: inquiry.status,
    bookingId: inquiry.booking_id,
  }));

  // Open leads first -- these are the ones with work left on them. Converted
  // and lost leads stay on the page, below, because the record of what did not
  // book is worth keeping and is never deleted.
  const open = cards.filter((c) => !isTerminalInquiryStatus(c.status));
  const closed = cards.filter((c) => isTerminalInquiryStatus(c.status));
  const unanswered = open.filter((c) => needsReply(c.status)).length;

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-sm font-medium text-admin-accent">Leads</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Inquiries</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Everyone who has asked about a shoot. Move a lead along as you talk to them, and convert
          it when it becomes a job -- the booking is created with their name, contact details,
          requested date, service, location and message already filled in.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Stat label="Open" value={open.length} />
        <Stat label="Awaiting a reply" value={unanswered} highlight={unanswered > 0} />
        <Stat label="Booked" value={cards.filter((c) => c.status === "converted").length} />
        <Stat label="Not booked" value={cards.filter((c) => c.status === "lost").length} />
      </div>

      {open.length ? (
        <div className="mt-7 grid gap-4">
          {open.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={cards.length ? "No open leads." : "No inquiries yet."}
            description={
              cards.length
                ? "Everything that has come in has been booked or closed out."
                : "When someone submits the public contact form, their request appears here with their event details and message."
            }
          />
        </div>
      )}

      {closed.length ? (
        <section className="mt-12">
          <h2 className="admin-display text-xl text-admin-ink">Closed</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Kept so you can see what booked and what did not.
          </p>
          <div className="mt-4 grid gap-4">
            {closed.map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
        highlight
          ? "border-admin-status-danger/30 bg-admin-status-danger-tint text-admin-status-danger"
          : "border-admin-line bg-admin-surface text-admin-muted"
      }`}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      {label}
    </span>
  );
}
