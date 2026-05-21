import { EmptyState } from "@/components/empty-state";
import { requireAdmin } from "@/lib/auth";
import { getAdminInquiries } from "@/lib/admin-data";
import { formatCompactDate } from "@/lib/utils";

export default async function AdminInquiriesPage() {
  await requireAdmin();

  const inquiries = await getAdminInquiries();

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-medium text-[#9b744f]">Client requests</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Inquiries</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
          Submissions from the public contact form. Reply to confirm the booking, then send deposit
          instructions separately via email.
        </p>
      </div>

      <div className="mt-6 rounded-md border border-[#9b744f]/30 bg-[#b98257]/8 px-5 py-4 text-sm leading-6 text-[#17130f]/75">
        <p className="font-medium text-[#17130f]">Payment workflow — Interac e-Transfer</p>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Review inquiry and reply to confirm the booking date.</li>
          <li>
            Email deposit instructions: send an Interac e-Transfer request to the client&apos;s email for the
            deposit amount. Include your e-Transfer email address and any security question/answer.
          </li>
          <li>Once the deposit is received, update the gallery&apos;s <strong>Deposit status</strong> field.</li>
          <li>After the event, request the remaining balance via e-Transfer and mark it <strong>Paid in full</strong> when received.</li>
        </ol>
        <p className="mt-3 text-[#17130f]/55 text-xs">
          No payment is collected through this website. Deposit status is tracked per gallery under{" "}
          <strong>Admin → Galleries → [gallery] → Payment</strong>.
        </p>
      </div>
      {inquiries.length ? (
        <div className="mt-8 grid gap-4">
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{inquiry.name}</h2>
                  <p className="mt-1 text-sm text-[#17130f]/58">
                    <a href={`mailto:${inquiry.email}`} className="hover:text-[#9b744f]">
                      {inquiry.email}
                    </a>
                    {inquiry.phone ? ` · ${inquiry.phone}` : ""}
                  </p>
                </div>
                <p className="text-sm text-[#17130f]/48">{formatCompactDate(inquiry.created_at)}</p>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <dt className="text-[#17130f]/45">Event type</dt>
                  <dd className="mt-1">{inquiry.event_type ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-[#17130f]/45">Event date</dt>
                  <dd className="mt-1">{formatCompactDate(inquiry.event_date)}</dd>
                </div>
                <div>
                  <dt className="text-[#17130f]/45">Location</dt>
                  <dd className="mt-1">{inquiry.location ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-[#17130f]/45">Budget</dt>
                  <dd className="mt-1">{inquiry.budget ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-[#17130f]/45">Referral</dt>
                  <dd className="mt-1">{inquiry.referral_source ?? "Not provided"}</dd>
                </div>
              </dl>
              <p className="mt-5 whitespace-pre-wrap rounded-md bg-[#f3f0ea] p-4 text-sm leading-6 text-[#17130f]/72">
                {inquiry.message}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No inquiries yet."
            description="When someone submits the public contact form, their request will appear here with event details and message context."
          />
        </div>
      )}
    </div>
  );
}
