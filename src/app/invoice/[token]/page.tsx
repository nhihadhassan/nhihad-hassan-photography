import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, MapPin } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { portfolioItems } from "@/data/photography";
import { getBookingByToken } from "@/lib/bookings";
import { brandConfig } from "@/lib/config";
import { getInvoiceView } from "@/lib/invoice-data";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

const TZ = "America/Toronto";
const fallbackHero =
  portfolioItems.find((item) => item.id === "engagement-couple-porch") ?? portfolioItems[0];

function formatDate(iso: string | null, short = false) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: short ? "short" : "long",
    day: "numeric",
    timeZone: TZ,
  });
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function StatusPill({ paid, partial = false }: { paid: boolean; partial?: boolean }) {
  const label = paid ? "Paid" : partial ? "Part paid" : "Due";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
        paid
          ? "bg-[#e7efe8] text-[#3f6e4a]"
          : partial
            ? "bg-[#f4ecd7] text-[#7a5b19]"
            : "bg-[#f3e7df] text-[#8a5135]"
      }`}
    >
      {label}
    </span>
  );
}

function MoneySummary({
  subtotal,
  discount,
  paid,
  balance,
}: {
  subtotal: number;
  discount: number;
  paid: number;
  balance: number;
}) {
  const total = Math.max(0, subtotal - discount);
  return (
    <dl className="ml-auto mt-8 w-full max-w-sm text-sm tabular-nums">
      <div className="flex justify-between gap-6 py-2 text-ink/65">
        <dt>Subtotal</dt>
        <dd className="text-ink">{formatMoney(subtotal)}</dd>
      </div>
      {discount > 0 ? (
        <div className="flex justify-between gap-6 py-2 text-ink/65">
          <dt>Discount</dt>
          <dd className="text-ink">-{formatMoney(discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-6 py-2 text-ink/65">
        <dt>Total</dt>
        <dd className="text-ink">{formatMoney(total)}</dd>
      </div>
      {paid > 0 ? (
        <div className="flex justify-between gap-6 py-2 text-ink/65">
          <dt>Payments received</dt>
          <dd className="text-ink">-{formatMoney(paid)}</dd>
        </div>
      ) : null}
      <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-ink/15 pt-4 font-semibold text-ink">
        <dt>Amount due</dt>
        <dd className="text-xl">{formatMoney(balance)}</dd>
      </div>
    </dl>
  );
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f1efec] px-5 text-ink">
        <div className="text-center">
          <p className="font-serif text-3xl">Invoice unavailable</p>
          <p className="mt-2 text-sm text-ink/55">This link may have expired or been replaced.</p>
        </div>
      </main>
    );
  }

  const invoice = await getInvoiceView(booking);
  const issued = formatDate(invoice.issuedAt);
  const shootDate = formatDate(invoice.shootDate);
  const dueDate = formatDate(invoice.dueDate ?? invoice.shootDate);
  const dueDateShort = formatDate(invoice.dueDate ?? invoice.shootDate, true);
  const heroUrl = invoice.heroImageUrl ?? fallbackHero.imageUrl;
  const heroAlt = invoice.heroImageAlt ?? fallbackHero.alt;
  const hasDepositSchedule = invoice.deposit > 0 && invoice.deposit < invoice.total;
  const balanceAfterDeposit = Math.max(0, invoice.total - invoice.deposit);
  const depositPaid = invoice.paid >= invoice.deposit - 0.005;
  const amountAfterDepositPaid = Math.max(0, invoice.paid - invoice.deposit);
  const balanceStagePaid = invoice.paidInFull;
  const balanceStagePartial = depositPaid && amountAfterDepositPaid > 0 && !balanceStagePaid;

  const headline = invoice.paidInFull
    ? "Thank you. Your invoice is paid in full."
    : dueDate
      ? `Your balance of ${formatMoney(invoice.balance)} is due on ${dueDate}.`
      : `Your invoice is ready. The current balance is ${formatMoney(invoice.balance)}.`;

  return (
    <div className="min-h-[100dvh] bg-[#f1efec] text-ink print:bg-white">
      <header className="relative h-[34rem] overflow-hidden bg-charcoal text-soft-white print:hidden sm:h-[35rem]">
        <Image
          src={heroUrl}
          alt={heroAlt}
          fill
          priority
          sizes="100vw"
          unoptimized={heroUrl.startsWith("http")}
          className="object-cover"
          style={{ objectPosition: `${invoice.heroFocalX}% ${invoice.heroFocalY}%` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.58)_0%,rgba(8,8,8,0.2)_36%,rgba(8,8,8,0.62)_100%)]" />

        <div className="absolute inset-x-0 top-0 z-10 px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-soft-white/80 transition hover:text-soft-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to site
            </Link>
            <p className="font-serif text-lg text-soft-white sm:text-2xl">{brandConfig.name}</p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-28 z-10 px-5 text-center sm:bottom-32">
          <p className="text-lg font-semibold sm:text-xl">Hi {firstName(invoice.clientName)},</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-2xl font-semibold leading-tight text-balance sm:text-3xl">
            {headline}
          </h1>
        </div>
      </header>

      <main className="relative z-20 mx-auto -mt-24 max-w-[52rem] px-4 pb-20 sm:px-6 print:mt-0 print:max-w-none print:px-0 print:pb-0">
        <article className="bg-[#fffefa] shadow-[0_16px_55px_rgba(30,25,20,0.09)] print:shadow-none">
          <section className="px-6 py-8 sm:px-12 sm:py-11 print:px-0 print:py-0">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">Invoice #{invoice.invoiceNumber}</h2>
                <StatusPill paid={invoice.paidInFull} partial={invoice.paid > 0} />
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <PrintButton
                  iconOnly
                  className="rounded-md border-ink/15 hover:bg-ink/[0.04]"
                />
                <a
                  href={`/api/invoice/${booking.token}/pdf`}
                  aria-label="Download invoice PDF"
                  title="Download invoice PDF"
                  className="inline-flex size-11 items-center justify-center rounded-md border border-ink/15 text-ink/70 transition hover:border-ink/30 hover:bg-ink/[0.04] hover:text-ink"
                >
                  <Download className="size-5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-b border-ink/10 pb-8 sm:grid-cols-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ink/42">From</p>
                <p className="mt-2 text-sm font-medium">{brandConfig.name}</p>
                <p className="mt-1 text-xs text-ink/55">Toronto, Ontario</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ink/42">To</p>
                <p className="mt-2 text-sm font-medium">{invoice.clientName}</p>
                {invoice.clientEmail ? <p className="mt-1 break-all text-xs text-ink/55">{invoice.clientEmail}</p> : null}
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ink/42">Issue date</p>
                <p className="mt-2 text-sm font-medium">{issued}</p>
                {invoice.poNumber ? <p className="mt-1 text-xs text-ink/55">PO / SO {invoice.poNumber}</p> : null}
              </div>
            </div>

            {!invoice.paidInFull && invoice.balance > 0 ? (
              <a
                href="#payment-details"
                className="mt-8 flex min-h-14 w-full items-center justify-center bg-ink px-5 text-xs font-semibold uppercase tracking-[0.18em] text-soft-white transition hover:bg-charcoal print:hidden"
              >
                View payment instructions
              </a>
            ) : null}
          </section>

          <section className="border-t-[0.65rem] border-[#f1efec] px-6 py-9 sm:px-12 sm:py-12 print:border-t print:border-ink/10 print:px-0 print:py-8">
            <h2 className="text-lg font-semibold">Items</h2>

            <div className="mt-7 hidden sm:block">
              <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem] gap-4 border-b border-ink/10 pb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/42">
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
              </div>
              {invoice.itemised ? (
                invoice.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem] gap-4 border-b border-ink/8 py-5 text-sm">
                    <p className="whitespace-pre-line font-medium leading-6">{item.description}</p>
                    <p className="text-right tabular-nums text-ink/65">{item.quantity}</p>
                    <p className="text-right tabular-nums text-ink/65">{formatMoney(item.unitPrice)}</p>
                    <p className="text-right font-medium tabular-nums">{formatMoney(item.amount)}</p>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem] gap-4 border-b border-ink/8 py-5 text-sm">
                  <div>
                    <p className="font-medium">{invoice.shootType}</p>
                    {shootDate ? <p className="mt-1 text-xs text-ink/55">{shootDate}</p> : null}
                    {invoice.location ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink/55"><MapPin className="size-3" aria-hidden="true" />{invoice.location}</p>
                    ) : null}
                  </div>
                  <p className="text-right text-ink/65">1</p>
                  <p className="text-right tabular-nums text-ink/65">{formatMoney(invoice.total)}</p>
                  <p className="text-right font-medium tabular-nums">{formatMoney(invoice.total)}</p>
                </div>
              )}
            </div>

            <div className="mt-5 divide-y divide-ink/10 sm:hidden">
              {(invoice.itemised
                ? invoice.items
                : [{ id: "legacy", description: invoice.shootType, quantity: 1, unitPrice: invoice.total, amount: invoice.total }]
              ).map((item) => (
                <div key={item.id} className="py-5 first:pt-0">
                  <p className="whitespace-pre-line text-sm font-medium leading-6">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink/55">
                    <span>{item.quantity} × {formatMoney(item.unitPrice)}</span>
                    <span className="text-sm font-medium text-ink">{formatMoney(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <MoneySummary
              subtotal={invoice.subtotal}
              discount={invoice.discount}
              paid={invoice.paid}
              balance={invoice.balance}
            />

            {invoice.notes ? (
              <div className="mt-12 max-w-xl">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ink/42">Note</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink/70">{invoice.notes}</p>
              </div>
            ) : null}
          </section>
        </article>

        <section id="payment-details" className="mt-3 bg-[#fffefa] px-6 py-9 shadow-[0_12px_40px_rgba(30,25,20,0.06)] sm:px-12 sm:py-11 print:mt-8 print:shadow-none">
          <h2 className="text-lg font-semibold">Payment details</h2>

          <div className="mt-6 overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1fr)_9rem_9rem_7rem] gap-4 border-b border-ink/10 pb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/42 sm:grid">
              <span>Payment</span><span>Amount</span><span>Due</span><span>Status</span>
            </div>
            {hasDepositSchedule ? (
              <>
                <div className="grid gap-2 border-b border-ink/8 py-5 text-sm sm:grid-cols-[minmax(0,1fr)_9rem_9rem_7rem] sm:items-center sm:gap-4">
                  <p className="font-medium">Reservation deposit</p>
                  <p className="tabular-nums">{formatMoney(invoice.deposit)}</p>
                  <p className="text-ink/60">On booking</p>
                  <div><StatusPill paid={depositPaid} partial={invoice.paid > 0 && !depositPaid} /></div>
                </div>
                <div className="grid gap-2 border-b border-ink/8 py-5 text-sm sm:grid-cols-[minmax(0,1fr)_9rem_9rem_7rem] sm:items-center sm:gap-4">
                  <p className="font-medium">Remaining balance</p>
                  <p className="tabular-nums">{formatMoney(balanceAfterDeposit)}</p>
                  <p className="text-ink/60">{dueDateShort ?? "On receipt"}</p>
                  <div><StatusPill paid={balanceStagePaid} partial={balanceStagePartial} /></div>
                </div>
              </>
            ) : (
              <div className="grid gap-2 border-b border-ink/8 py-5 text-sm sm:grid-cols-[minmax(0,1fr)_9rem_9rem_7rem] sm:items-center sm:gap-4">
                <p className="font-medium">Invoice balance</p>
                <p className="tabular-nums">{formatMoney(invoice.total)}</p>
                <p className="text-ink/60">{dueDateShort ?? "On receipt"}</p>
                <div><StatusPill paid={invoice.paidInFull} partial={invoice.paid > 0} /></div>
              </div>
            )}
          </div>

          <div className="mt-8 max-w-2xl border-t border-ink/10 pt-7">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ink/42">How to pay</p>
            {invoice.paidInFull ? (
              <p className="mt-3 text-sm leading-6 text-ink/70">Payment received in full. Thank you.</p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink/70">
                Send an Interac e-Transfer of <strong className="font-semibold text-ink">{formatMoney(invoice.balance)}</strong> to{" "}
                <a className="font-medium text-ink underline decoration-ink/30 underline-offset-4" href={`mailto:${brandConfig.contactEmail}`}>
                  {brandConfig.contactEmail}
                </a>
                {dueDate ? ` by ${dueDate}` : ""}. Please include {invoice.invoiceNumber} in the message.
              </p>
            )}
            <p className="mt-4 text-xs text-ink/45">All amounts are in Canadian dollars.</p>
          </div>
        </section>

        <p className="py-9 text-center text-xs uppercase tracking-[0.18em] text-ink/40 print:hidden">
          {brandConfig.name}
        </p>
      </main>
    </div>
  );
}
