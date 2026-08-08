import { redirect } from "next/navigation";

/** The per-booking invoice editor moved to the document-first /admin/invoices flow. */
export default async function BookingInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/invoices/${id}/edit`);
}
