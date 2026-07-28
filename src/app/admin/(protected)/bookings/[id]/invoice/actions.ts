"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { saveInvoiceItems } from "@/lib/invoice-items";
import { parseInvoiceDraft } from "@/lib/invoice-draft";

export type SaveInvoiceResult = { ok: boolean; message: string };

/**
 * Persists the invoice draft: the line items plus the invoice-level fields that
 * live on the booking row. The legacy `bookings.total` text column is left
 * alone; totals are derived from line items at read time.
 */
export async function saveInvoiceAction(
  bookingId: string,
  draft: unknown,
): Promise<SaveInvoiceResult> {
  await requireAdmin();

  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "Booking not found." };

  const parsed = parseInvoiceDraft(draft);

  try {
    await saveInvoiceItems(bookingId, parsed.items);

    const admin = getServiceRoleSupabaseClient();
    const { error } = await admin
      .from("bookings")
      .update({
        invoice_discount: parsed.discount > 0 ? parsed.discount : null,
        invoice_due_date: parsed.dueDate,
        invoice_po_number: parsed.poNumber,
        invoice_notes: parsed.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    if (error) throw new Error(error.message);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not save the invoice.",
    };
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/admin/bookings/${bookingId}/invoice`);
  revalidatePath("/admin/finances");

  return {
    ok: true,
    message: parsed.items.length
      ? `Saved ${parsed.items.length} line item${parsed.items.length === 1 ? "" : "s"}.`
      : "Invoice saved.",
  };
}
