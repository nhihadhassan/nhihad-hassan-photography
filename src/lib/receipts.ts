import "server-only";

import { randomBytes } from "node:crypto";
import { getBookingById } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type ReceiptSnapshot = {
  receiptNumber: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  amount: number;
  paidOn: string;
  method: string;
  invoiceTotal: number;
  totalPaid: number;
  balance: number;
};

export type Receipt = {
  id: string;
  receipt_no: number;
  token: string;
  booking_id: string;
  payment_id: string;
  replaces_receipt_id: string | null;
  amount: number;
  paid_on: string;
  method: string | null;
  snapshot: ReceiptSnapshot | null;
  sent_at: string | null;
  viewed_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReceiptView = ReceiptSnapshot & {
  id: string;
  token: string;
  bookingId: string;
  sentAt: string | null;
  viewedAt: string | null;
  voidedAt: string | null;
};

function mapReceipt(row: Record<string, unknown>): Receipt {
  return {
    id: String(row.id),
    receipt_no: Number(row.receipt_no),
    token: String(row.token),
    booking_id: String(row.booking_id),
    payment_id: String(row.payment_id),
    replaces_receipt_id: (row.replaces_receipt_id as string | null) ?? null,
    amount: Number(row.amount),
    paid_on: String(row.paid_on),
    method: (row.method as string | null) ?? null,
    snapshot: (row.snapshot as ReceiptSnapshot | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    viewed_at: (row.viewed_at as string | null) ?? null,
    voided_at: (row.voided_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function receiptNumber(value: number): string {
  return `REC-${String(value).padStart(4, "0")}`;
}

export async function ensureReceiptForPayment(paymentId: string): Promise<Receipt> {
  const admin = getServiceRoleSupabaseClient();
  const { data: existing } = await admin.from("receipts").select("*").eq("payment_id", paymentId).is("voided_at", null).maybeSingle();
  if (existing) return mapReceipt(existing as Record<string, unknown>);
  const { data: payment, error: paymentError } = await admin.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (paymentError || !payment) throw new Error(paymentError?.message ?? "Payment not found.");
  if (!payment.booking_id) throw new Error("Link the payment to a booking before creating a receipt.");
  const { data, error } = await admin.from("receipts").insert({
    token: randomBytes(24).toString("hex"),
    booking_id: payment.booking_id,
    payment_id: payment.id,
    amount: payment.amount,
    paid_on: payment.paid_on,
    method: payment.method,
  }).select("*").single();
  if (error || !data) {
    const { data: raced } = await admin.from("receipts").select("*").eq("payment_id", paymentId).is("voided_at", null).maybeSingle();
    if (raced) return mapReceipt(raced as Record<string, unknown>);
    throw new Error(error?.message ?? "Could not prepare the receipt.");
  }
  return mapReceipt(data as Record<string, unknown>);
}

export async function listReceipts(): Promise<Receipt[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin.from("receipts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapReceipt(row as Record<string, unknown>));
}

export async function listReceiptsForBooking(bookingId: string): Promise<Receipt[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin.from("receipts").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapReceipt(row as Record<string, unknown>));
}

export async function getReceiptByToken(token: string): Promise<Receipt | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("receipts").select("*").eq("token", token).maybeSingle();
  return data ? mapReceipt(data as Record<string, unknown>) : null;
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("receipts").select("*").eq("id", id).maybeSingle();
  return data ? mapReceipt(data as Record<string, unknown>) : null;
}

export async function getReceiptView(receipt: Receipt): Promise<ReceiptView> {
  if (receipt.snapshot) {
    return { ...receipt.snapshot, id: receipt.id, token: receipt.token, bookingId: receipt.booking_id, sentAt: receipt.sent_at, viewedAt: receipt.viewed_at, voidedAt: receipt.voided_at };
  }
  const booking = await getBookingById(receipt.booking_id);
  if (!booking) throw new Error("Booking not found.");
  const invoice = await getInvoiceView(booking);
  return {
    id: receipt.id,
    token: receipt.token,
    bookingId: receipt.booking_id,
    receiptNumber: receiptNumber(receipt.receipt_no),
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    shootType: invoice.shootType,
    amount: receipt.amount,
    paidOn: receipt.paid_on,
    method: receipt.method || "Interac e-Transfer",
    invoiceTotal: invoice.total,
    totalPaid: invoice.paid,
    balance: invoice.balance,
    sentAt: receipt.sent_at,
    viewedAt: receipt.viewed_at,
    voidedAt: receipt.voided_at,
  };
}

export async function freezeReceipt(receipt: Receipt, snapshot: ReceiptSnapshot): Promise<void> {
  if (receipt.snapshot) return;
  const admin = getServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("receipts").update({ snapshot, updated_at: now }).eq("id", receipt.id).is("snapshot", null);
  if (error) throw new Error(error.message);
}

export async function markReceiptSent(receiptId: string): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("receipts").update({ sent_at: now, updated_at: now }).eq("id", receiptId).is("sent_at", null);
  if (error) throw new Error(error.message);
}

export async function markReceiptViewed(receiptId: string): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  await admin.from("receipts").update({ viewed_at: now, updated_at: now }).eq("id", receiptId).is("viewed_at", null);
}

/** Void a receipt without changing its frozen snapshot, then issue a new
 * numbered draft for the same underlying payment. */
export async function voidAndReplaceReceipt(receiptId: string): Promise<Receipt> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin.rpc("void_and_replace_receipt", {
    p_receipt_id: receiptId,
    p_token: randomBytes(24).toString("hex"),
  });
  if (error || !data) throw new Error(error?.message ?? "Could not prepare the replacement receipt.");
  return mapReceipt(data as unknown as Record<string, unknown>);
}
