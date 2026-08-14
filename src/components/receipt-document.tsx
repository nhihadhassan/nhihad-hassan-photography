import { brandConfig } from "@/lib/config";
import type { ReceiptView } from "@/lib/receipts";
import { formatMoney } from "@/lib/utils";

export function ReceiptDocument({ receipt }: { receipt: ReceiptView }) {
  const paidOn = new Date(`${receipt.paidOn}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <article className="bg-[#fbf8f1] p-6 text-[#171411] shadow-[0_24px_70px_rgba(43,35,28,0.1)] sm:p-10">
      <header className="flex flex-col gap-5 border-b border-[#171411]/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="font-serif text-2xl">{brandConfig.name}</p><p className="mt-1 text-sm text-[#171411]/55">{brandConfig.contactEmail}</p></div>
        <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6444]">Payment receipt</p><p className="mt-2 text-sm">{receipt.receiptNumber}</p></div>
      </header>
      <section className="py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6444]">Received from</p>
        <h2 className="mt-3 font-serif text-4xl">{receipt.clientName}</h2>
        <p className="mt-7 text-sm text-[#171411]/58">Payment for</p>
        <div className="mt-2 flex items-end justify-between gap-5 border-b border-[#171411]/10 pb-6">
          <p className="font-medium">{receipt.shootType}</p><p className="font-serif text-3xl">{formatMoney(receipt.amount)}</p>
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          <ReceiptRow label="Payment date" value={paidOn} />
          <ReceiptRow label="Method" value={receipt.method} />
          <ReceiptRow label="Invoice" value={receipt.invoiceNumber} />
          <ReceiptRow label="Invoice total" value={formatMoney(receipt.invoiceTotal)} />
          <ReceiptRow label="Total received" value={formatMoney(receipt.totalPaid)} />
          <ReceiptRow label="Balance remaining" value={formatMoney(receipt.balance)} strong />
        </dl>
      </section>
      <footer className="border-t border-[#171411]/10 pt-6 text-sm text-[#171411]/55">
        Thank you. This confirms payment received.
      </footer>
    </article>
  );
}

function ReceiptRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-5"><dt className="text-[#171411]/58">{label}</dt><dd className={strong ? "font-semibold" : ""}>{value}</dd></div>;
}
