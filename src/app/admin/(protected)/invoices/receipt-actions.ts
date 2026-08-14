"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { brandConfig } from "@/lib/config";
import { sendReceiptEmail } from "@/lib/notify-email";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import { freezeReceipt, getReceiptById, getReceiptView, markReceiptSent, voidAndReplaceReceipt } from "@/lib/receipts";
import { siteUrl } from "@/lib/seo";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/utils";

export async function sendReceiptAction(receiptId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const receipt = await getReceiptById(receiptId);
  if (!receipt) return { ok: false, message: "Receipt not found." };
  if (receipt.voided_at) return { ok: false, message: "This receipt is void." };
  const view = await getReceiptView(receipt);
  if (!view.clientEmail) return { ok: false, message: "Add a client email before sending." };
  await freezeReceipt(receipt, {
    receiptNumber: view.receiptNumber,
    invoiceNumber: view.invoiceNumber,
    clientName: view.clientName,
    clientEmail: view.clientEmail,
    shootType: view.shootType,
    amount: view.amount,
    paidOn: view.paidOn,
    method: view.method,
    invoiceTotal: view.invoiceTotal,
    totalPaid: view.totalPaid,
    balance: view.balance,
  });
  const pdf = await buildReceiptPdf(view);
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const subject = `Receipt ${view.receiptNumber} · ${brandConfig.name}`;
  const admin = getServiceRoleSupabaseClient();
  const { data: delivery, error: deliveryError } = await admin.from("receipt_deliveries").insert({
    receipt_id: receipt.id,
    sent_to: view.clientEmail,
    subject,
  }).select("id").single();
  if (deliveryError || !delivery) return { ok: false, message: deliveryError?.message ?? "Could not start receipt delivery." };
  const result = await sendReceiptEmail({
    to: view.clientEmail,
    clientName: view.clientName,
    receiptNumber: view.receiptNumber,
    amount: formatMoney(view.amount),
    receiptUrl: `${origin}/receipt/${receipt.token}`,
    pdf,
    idempotencyKey: `receipt-${delivery.id}`,
  });
  if (!result.ok || !result.messageId) {
    await admin.from("receipt_deliveries").update({ status: "failed", failure_reason: result.message }).eq("id", delivery.id);
    return { ok: false, message: result.message };
  }
  const now = new Date().toISOString();
  await admin.from("receipt_deliveries").update({ status: "sent", resend_message_id: result.messageId, sent_at: now }).eq("id", delivery.id);
  await markReceiptSent(receipt.id);
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/bookings/${receipt.booking_id}`);
  return { ok: true, message: `Receipt sent to ${view.clientEmail}.` };
}

export async function voidAndReplaceReceiptAction(receiptId: string): Promise<{ ok: boolean; message: string; replacementId?: string }> {
  await requireAdmin();
  try {
    const replacement = await voidAndReplaceReceipt(receiptId);
    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/bookings/${replacement.booking_id}`);
    return { ok: true, message: `Receipt ${replacement.receipt_no} prepared as a replacement.`, replacementId: replacement.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not replace the receipt." };
  }
}
