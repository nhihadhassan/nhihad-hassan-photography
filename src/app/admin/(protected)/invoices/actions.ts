"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createBooking, getBookingById } from "@/lib/bookings";
import { buildInvoiceSnapshot, getInvoiceView } from "@/lib/invoice-data";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { cancelInvoice, markInvoiceSentIfFirstTime, reactivateInvoice } from "@/lib/invoice-lifecycle";
import {
  createInvoiceDeliveryAttempt,
  markInvoiceDeliveryFailed,
  markInvoiceDeliverySent,
} from "@/lib/invoice-deliveries";
import { sendInvoiceEmail } from "@/lib/notify-email";
import { logBookingEvent } from "@/lib/events";
import { formatMoney } from "@/lib/utils";
import { siteUrl } from "@/lib/seo";
import { brandConfig } from "@/lib/config";

/**
 * Step one of creating an invoice: a client and nothing else. This creates a
 * booking row purely as the invoice's anchor (same row type an actual shoot
 * booking uses, just without shoot details) and hands back its id so the
 * caller can route straight into the line-item editor.
 */
export async function createInvoiceDraftAction(input: {
  clientName: string;
  clientEmail?: string | null;
}): Promise<{ ok: boolean; message: string; id?: string }> {
  await requireAdmin();
  if (!input.clientName.trim()) return { ok: false, message: "Enter a client name." };
  try {
    const { id } = await createBooking({
      clientName: input.clientName.trim(),
      clientEmail: input.clientEmail?.trim() || null,
    });
    revalidatePath("/admin/invoices");
    return { ok: true, message: "Invoice created.", id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not create the invoice." };
  }
}

export async function sendInvoiceAction(
  bookingId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "Booking not found." };
  if (!booking.client_email) {
    return { ok: false, message: "This booking has no client email. Add one first." };
  }

  if (booking.invoice_cancelled_at) {
    return { ok: false, message: "This invoice is cancelled. Reactivate it before sending." };
  }

  const view = await getInvoiceView(booking);
  if (view.total <= 0) {
    return {
      ok: false,
      message: "Add at least one line item or a booking total before sending an invoice.",
    };
  }

  // Freezes content on the first send only; a resend reuses that same
  // snapshot, so getInvoiceView() below already reflects it once written.
  await markInvoiceSentIfFirstTime(booking.id, buildInvoiceSnapshot(view));

  const { invoiceNumber } = view;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const invoiceUrl = `${origin}/invoice/${booking.token}`;
  const subject = `Invoice ${invoiceNumber} · ${brandConfig.name}`;
  const pdf = await buildInvoicePdf({ ...view, lines: view.items });

  let deliveryId: string;
  try {
    deliveryId = await createInvoiceDeliveryAttempt({
      bookingId: booking.id,
      sentTo: booking.client_email,
      subject,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not start invoice delivery.",
    };
  }

  const result = await sendInvoiceEmail({
    to: booking.client_email,
    clientName: booking.client_name,
    invoiceNumber,
    amountDue: formatMoney(view.balance),
    invoiceUrl,
    pdf,
  });

  if (!result.ok || !result.messageId) {
    const message = result.ok ? "Email provider did not return a message id." : result.message;
    await markInvoiceDeliveryFailed(deliveryId, message).catch(() => undefined);
    revalidatePath("/admin/finances");
    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${booking.id}/edit`);
    revalidatePath(`/admin/invoices/${booking.id}/preview`);
    revalidatePath(`/admin/bookings/${booking.id}`);
    return { ok: false, message };
  }

  try {
    await markInvoiceDeliverySent(deliveryId, result.messageId);
  } catch (error) {
    return {
      ok: false,
      message: `Invoice was sent, but delivery history could not be saved: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    };
  }

  await logBookingEvent({
    bookingId: booking.id,
    type: "invoice",
    summary: `${invoiceNumber} emailed to ${booking.client_email}`,
    payload: {
      deliveryId,
      resendMessageId: result.messageId,
      amountDue: view.balance,
    },
  });
  revalidatePath("/admin/finances");
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${booking.id}/edit`);
  revalidatePath(`/admin/invoices/${booking.id}/preview`);
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}`);
  return { ok: true, message: `Invoice sent to ${booking.client_email}.` };
}

function revalidateInvoicePaths(bookingId: string) {
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${bookingId}/edit`);
  revalidatePath(`/admin/invoices/${bookingId}/preview`);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function cancelInvoiceAction(bookingId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await cancelInvoice(bookingId);
    revalidateInvoicePaths(bookingId);
    return { ok: true, message: "Invoice cancelled." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not cancel the invoice." };
  }
}

export async function reactivateInvoiceAction(bookingId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await reactivateInvoice(bookingId);
    revalidateInvoicePaths(bookingId);
    return { ok: true, message: "Invoice reactivated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not reactivate the invoice." };
  }
}
