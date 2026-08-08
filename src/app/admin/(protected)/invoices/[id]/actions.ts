"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { saveInvoiceItems } from "@/lib/invoice-items";
import { parseInvoiceDraft } from "@/lib/invoice-draft";

export type SaveInvoiceResult = { ok: boolean; message: string };

export type SaveInvoiceInput = {
  clientName: string;
  clientEmail: string | null;
  draft: unknown;
};

/**
 * Autosave target for the invoice builder: the line items, client identity,
 * and the invoice-level fields that live on the booking row. Locked once
 * sent -- getBookingById's invoice_sent_at is what the edit page itself
 * checks before ever rendering the builder, but this is re-checked here too
 * since a save could race a send from another tab.
 */
export async function saveInvoiceAction(bookingId: string, input: SaveInvoiceInput): Promise<SaveInvoiceResult> {
  await requireAdmin();

  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "Invoice not found." };
  if (booking.invoice_sent_at) {
    return { ok: false, message: "This invoice has been sent and can no longer be edited." };
  }

  const draft = parseInvoiceDraft(input.draft);

  try {
    await saveInvoiceItems(bookingId, draft.items);

    const admin = getServiceRoleSupabaseClient();
    const { error } = await admin
      .from("bookings")
      .update({
        client_name: input.clientName.trim() || null,
        client_email: input.clientEmail?.trim() || null,
        invoice_discount: draft.discount > 0 ? draft.discount : null,
        invoice_tax_rate: draft.taxRate > 0 ? draft.taxRate : null,
        invoice_due_date: draft.dueDate,
        invoice_po_number: draft.poNumber,
        invoice_notes: draft.notes,
        invoice_payment_instructions: draft.paymentInstructions,
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

  revalidatePath(`/admin/invoices/${bookingId}/edit`);
  revalidatePath(`/admin/invoices/${bookingId}/preview`);
  revalidatePath("/admin/invoices");

  return { ok: true, message: "Saved." };
}
