import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { InvoiceSnapshot } from "@/lib/bookings";

/**
 * Freezes the invoice's content the first time it is sent, so a later edit to
 * line items/discount/tax/notes never changes what a client already
 * received (mirrors signed_agreements.agreement_snapshot for contracts).
 * A no-op if this invoice already has a snapshot -- a resend must resend
 * exactly what was sent the first time, not new edits.
 */
export async function markInvoiceSentIfFirstTime(bookingId: string, snapshot: InvoiceSnapshot): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  await admin
    .from("bookings")
    .update({ invoice_sent_at: new Date().toISOString(), invoice_snapshot: snapshot })
    .eq("id", bookingId)
    .is("invoice_snapshot", null);
}

/** Best-effort: marks the first time a client opens the invoice link. Never throws. */
export async function markInvoiceViewed(bookingId: string): Promise<void> {
  try {
    const admin = getServiceRoleSupabaseClient();
    await admin
      .from("bookings")
      .update({ invoice_viewed_at: new Date().toISOString() })
      .eq("id", bookingId)
      .is("invoice_viewed_at", null);
  } catch {
    // Viewed tracking is a convenience, not a system of record.
  }
}

export async function cancelInvoice(bookingId: string): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("bookings")
    .update({ invoice_cancelled_at: new Date().toISOString() })
    .eq("id", bookingId);
  if (error) throw new Error(error.message);
}

export async function reactivateInvoice(bookingId: string): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("bookings")
    .update({ invoice_cancelled_at: null })
    .eq("id", bookingId);
  if (error) throw new Error(error.message);
}
