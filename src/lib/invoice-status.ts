/**
 * Single source of truth for an invoice's displayed status. Everything about
 * an invoice's lifecycle is derived here instead of stored redundantly --
 * "paid"/"overdue" would drift from the payments ledger and due date if kept
 * as separate stored flags. Only the explicit lifecycle timestamps
 * (sent/viewed/cancelled) are stored, on bookings; this turns those plus the
 * live payment total into one of the states the UI actually shows.
 */
export type InvoiceStatusKey =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export function computeInvoiceStatus(input: {
  total: number;
  paid: number;
  dueAt: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  cancelledAt: string | null;
}): InvoiceStatusKey {
  if (input.cancelledAt) return "cancelled";
  if (input.total > 0 && input.paid >= input.total - 0.005) return "paid";

  const overdue = input.dueAt ? new Date(input.dueAt).getTime() < Date.now() : false;
  if (input.paid > 0.005) return overdue ? "overdue" : "partially_paid";
  if (overdue) return "overdue";
  if (input.viewedAt) return "viewed";
  if (input.sentAt) return "sent";
  return "draft";
}
