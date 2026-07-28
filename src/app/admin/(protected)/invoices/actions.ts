"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getBookingById, getOrAssignInvoiceNumber } from "@/lib/bookings";
import { listPaymentsForBooking } from "@/lib/finance";
import { calculateInvoicePaymentState } from "@/lib/invoice-state";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
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

export async function sendInvoiceAction(
  bookingId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "Booking not found." };
  if (!booking.client_email) {
    return { ok: false, message: "This booking has no client email. Add one first." };
  }

  const [payments, assignedNumber] = await Promise.all([
    listPaymentsForBooking(booking.id),
    getOrAssignInvoiceNumber(booking.id),
  ]);
  const payment = calculateInvoicePaymentState({
    total: booking.total,
    deposit: booking.deposit,
    paid: payments.reduce((sum, item) => sum + item.amount, 0),
  });
  if (payment.total <= 0) {
    return { ok: false, message: "Add a booking total before sending an invoice." };
  }

  const invoiceNumber =
    assignedNumber ??
    `NHP-${booking.token.slice(0, 8).toUpperCase()}`;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const invoiceUrl = `${origin}/invoice/${booking.token}`;
  const subject = `Invoice ${invoiceNumber} · ${brandConfig.name}`;
  const pdf = await buildInvoicePdf({
    invoiceNumber,
    issuedAt: booking.created_at,
    clientName: booking.client_name ?? "Client",
    clientEmail: booking.client_email,
    shootType: booking.shoot_type ?? "Photography services",
    shootDate: booking.start_at,
    location: booking.location,
    ...payment,
  });

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
    amountDue: formatMoney(payment.balance),
    invoiceUrl,
    pdf,
  });

  if (!result.ok || !result.messageId) {
    const message = result.ok ? "Email provider did not return a message id." : result.message;
    await markInvoiceDeliveryFailed(deliveryId, message).catch(() => undefined);
    revalidatePath("/admin/finances");
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
      amountDue: payment.balance,
    },
  });
  revalidatePath("/admin/finances");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}`);
  return { ok: true, message: `Invoice sent to ${booking.client_email}.` };
}
