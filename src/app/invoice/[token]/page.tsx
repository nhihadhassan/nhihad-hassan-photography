import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { getBookingByToken } from "@/lib/bookings";
import { brandConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

const TZ = "America/Toronto";

function money(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

function amount(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });
}

function invoiceNumber(createdAt: string, token: string) {
  const d = new Date(createdAt);
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `NHP-${ymd}-${token.slice(0, 5).toUpperCase()}`;
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-6 py-2 ${strong ? "border-t border-ink/20 pt-3" : ""}`}>
      <dt className={strong ? "text-sm font-semibold text-ink" : "text-sm text-ink/60"}>{label}</dt>
      <dd className={strong ? "font-serif text-2xl text-ink" : "text-sm font-medium text-ink/90"}>{value}</dd>
    </div>
  );
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f3eee5] px-5 text-ink">
        <p className="text-sm text-ink/60">This invoice is unavailable.</p>
      </div>
    );
  }

  const total = money(booking.total);
  const deposit = money(booking.deposit);
  const balance = money(booking.balance);
  const totalNum = amount(booking.total);
  const number = invoiceNumber(booking.created_at, booking.token);
  const issued = formatDate(booking.created_at);
  const shootDate = formatDate(booking.start_at);
  const depositSettled =
    booking.gallery?.deposit_status === "paid" || booking.gallery?.deposit_status === "received";

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] px-5 py-12 text-ink print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
          <PrintButton />
        </div>

        <article className="rounded-xl border border-ink/12 bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:p-10 print:border-0 print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="font-serif text-2xl text-ink">{brandConfig.name}</p>
              <p className="mt-1 text-sm text-ink/55">{brandConfig.contactEmail}</p>
              <p className="text-sm text-ink/55">Toronto, Ontario</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">Invoice</p>
              <p className="mt-1 font-mono text-sm text-ink/80">{number}</p>
              {issued ? <p className="mt-2 text-xs text-ink/55">Issued {issued}</p> : null}
            </div>
          </div>

          {/* Bill to */}
          <div className="mt-8 grid gap-6 border-y border-ink/10 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Billed to</p>
              <p className="mt-2 text-sm font-medium text-ink">{booking.client_name ?? "Client"}</p>
              {booking.client_email ? <p className="text-sm text-ink/65">{booking.client_email}</p> : null}
            </div>
            <div className="sm:text-right">
              {shootDate ? (
                <>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Shoot date</p>
                  <p className="mt-2 text-sm text-ink/80">{shootDate}</p>
                </>
              ) : null}
            </div>
          </div>

          {/* Line item */}
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-left text-xs uppercase tracking-[0.14em] text-ink/45">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/8">
                <td className="py-3 text-ink/85">
                  {booking.shoot_type ?? "Photography services"}
                  {booking.location ? <span className="block text-xs text-ink/50">{booking.location}</span> : null}
                </td>
                <td className="py-3 text-right text-ink/85">{total ?? "Quoted"}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <dl className="mt-6 ml-auto max-w-xs">
            {total ? <SummaryRow label="Subtotal" value={total} /> : null}
            {deposit ? (
              <SummaryRow
                label={depositSettled ? "Deposit (paid)" : "Deposit (25%)"}
                value={deposit}
              />
            ) : null}
            <SummaryRow
              label={depositSettled ? "Balance due" : "Total due"}
              value={depositSettled ? (balance ?? total ?? "Quoted") : (total ?? "Quoted")}
              strong
            />
          </dl>

          {/* Payment */}
          <div className="mt-8 rounded-md border border-[#8b6444]/25 bg-[#8b6444]/[0.06] px-4 py-3 text-sm leading-6 text-ink/75">
            {depositSettled ? (
              <>
                Deposit received, thank you.{" "}
                {balance
                  ? `Please e-transfer the remaining ${balance} to `
                  : "Any balance can be e-transferred to "}
                <span className="font-medium text-ink">{brandConfig.contactEmail}</span> on or before
                the shoot day.
              </>
            ) : (
              <>
                Payment by Interac e-Transfer to{" "}
                <span className="font-medium text-ink">{brandConfig.contactEmail}</span>.
                {deposit ? ` A ${deposit} deposit reserves your date; the balance is due on or before the shoot day.` : ""}
              </>
            )}
          </div>

          {totalNum !== null ? (
            <p className="mt-6 text-xs text-ink/45">Amounts in Canadian dollars.</p>
          ) : null}
        </article>
      </div>
    </div>
  );
}
