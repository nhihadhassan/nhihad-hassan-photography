import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseAmount } from "@/lib/utils";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** quantity * unitPrice, rounded to cents. */
  amount: number;
};

/** A line item as submitted from the editor, before it has an id. */
export type InvoiceLineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

/** Rounds to cents, avoiding float drift like 0.1 + 0.2. */
function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toItem(row: {
  id: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
}): InvoiceLineItem {
  const quantity = Number(row.quantity) || 0;
  const unitPrice = Number(row.unit_price) || 0;
  return {
    id: row.id,
    description: row.description,
    quantity,
    unitPrice,
    amount: money(quantity * unitPrice),
  };
}

export async function listInvoiceItems(bookingId: string): Promise<InvoiceLineItem[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("invoice_line_items")
    .select("id,description,quantity,unit_price")
    .eq("booking_id", bookingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toItem);
}

/**
 * Replaces every line item on a booking with the supplied set. The editor
 * submits the whole table each save, so a delete-then-insert keeps ordering
 * simple and avoids diffing rows. Blank descriptions are dropped so an empty
 * trailing row in the UI never persists.
 */
export async function saveInvoiceItems(
  bookingId: string,
  items: InvoiceLineItemInput[],
): Promise<void> {
  const admin = getServiceRoleSupabaseClient();

  const clean = items
    .map((item) => ({
      description: item.description.trim(),
      quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
      unitPrice: Number.isFinite(item.unitPrice) ? item.unitPrice : 0,
    }))
    .filter((item) => item.description.length > 0);

  const { error: deleteError } = await admin
    .from("invoice_line_items")
    .delete()
    .eq("booking_id", bookingId);
  if (deleteError) throw new Error(deleteError.message);

  if (!clean.length) return;

  const { error: insertError } = await admin.from("invoice_line_items").insert(
    clean.map((item, index) => ({
      booking_id: bookingId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      sort_order: index,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}

export type InvoiceTotals = {
  items: InvoiceLineItem[];
  /** Sum of line item amounts, or the legacy booking total when un-itemised. */
  subtotal: number;
  discount: number;
  total: number;
  deposit: number;
  paid: number;
  balance: number;
  depositPaid: boolean;
  paidInFull: boolean;
  /** True when the figures come from line items rather than the legacy total. */
  itemised: boolean;
};

/**
 * Single source of truth for invoice arithmetic, shared by the admin editor,
 * the PDF, the client invoice page, and the preview, so no two surfaces can
 * disagree about what is owed.
 *
 * Bookings created before itemised invoicing have no line items; those fall
 * back to the legacy `bookings.total` text column and behave exactly as before.
 */
export function computeInvoiceTotals(input: {
  items: InvoiceLineItem[];
  /** Legacy `bookings.total`, used only when there are no line items. */
  fallbackTotal: string | null;
  deposit: string | null;
  discount: string | number | null;
  paid: number;
}): InvoiceTotals {
  const itemised = input.items.length > 0;

  const subtotal = itemised
    ? money(input.items.reduce((sum, item) => sum + item.amount, 0))
    : Math.max(0, parseAmount(input.fallbackTotal) ?? 0);

  // A discount only makes sense against an itemised subtotal, and can never
  // push the total below zero.
  const rawDiscount = itemised ? Math.max(0, Number(input.discount) || 0) : 0;
  const discount = money(Math.min(rawDiscount, subtotal));

  const total = money(Math.max(0, subtotal - discount));
  const deposit = Math.max(0, parseAmount(input.deposit) ?? 0);
  const paid = Math.max(0, input.paid);
  const balance = money(Math.max(0, total - paid));

  return {
    items: input.items,
    subtotal,
    discount,
    total,
    deposit,
    paid,
    balance,
    depositPaid: deposit > 0 && paid >= deposit - 0.005,
    paidInFull: total > 0 && balance <= 0.005,
    itemised,
  };
}
