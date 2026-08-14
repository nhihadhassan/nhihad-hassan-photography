import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { brandConfig } from "@/lib/config";
import { getReceiptByToken, getReceiptView, markReceiptViewed } from "@/lib/receipts";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const receipt = await getReceiptByToken(token);
  if (!receipt || receipt.voided_at || !receipt.sent_at) notFound();
  await markReceiptViewed(receipt.id);
  const view = await getReceiptView(receipt);
  const paidOn = new Date(`${view.paidOn}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  return (
    <main className="min-h-screen bg-[#f3eee6] px-4 py-10 text-[#171411] sm:px-6 sm:py-16">
      <article className="mx-auto max-w-2xl bg-[#fbf8f1] p-6 shadow-[0_24px_70px_rgba(43,35,28,0.1)] sm:p-10">
        <header className="flex flex-col gap-5 border-b border-[#171411]/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-serif text-2xl">{brandConfig.name}</p><p className="mt-1 text-sm text-[#171411]/55">{brandConfig.contactEmail}</p></div>
          <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6444]">Payment receipt</p><p className="mt-2 text-sm">{view.receiptNumber}</p></div>
        </header>
        <section className="py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6444]">Received from</p>
          <h1 className="mt-3 font-serif text-4xl">{view.clientName}</h1>
          <p className="mt-7 text-sm text-[#171411]/58">Payment for</p>
          <div className="mt-2 flex items-end justify-between gap-5 border-b border-[#171411]/10 pb-6">
            <p className="font-medium">{view.shootType}</p><p className="font-serif text-3xl">{formatMoney(view.amount)}</p>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Payment date" value={paidOn} /><Row label="Method" value={view.method} /><Row label="Invoice" value={view.invoiceNumber} /><Row label="Balance remaining" value={formatMoney(view.balance)} strong />
          </dl>
        </section>
        <footer className="flex flex-col gap-4 border-t border-[#171411]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#171411]/55">Thank you. This confirms payment received.</p>
          <a href={`/receipt/${token}/pdf`} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#171411]/15 px-4 text-sm font-medium"><Download className="size-4" aria-hidden="true" />Download PDF</a>
        </footer>
      </article>
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-5"><dt className="text-[#171411]/58">{label}</dt><dd className={strong ? "font-semibold" : ""}>{value}</dd></div>;
}
