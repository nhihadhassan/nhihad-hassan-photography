import type { Metadata } from "next";
import { getBookingByToken } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { markInvoiceViewed } from "@/lib/invoice-lifecycle";
import { InvoiceDocument } from "@/components/invoice-document";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

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

  await markInvoiceViewed(booking.id);
  const invoice = await getInvoiceView(booking);

  return <InvoiceDocument invoice={invoice} token={booking.token} variant="client" />;
}
