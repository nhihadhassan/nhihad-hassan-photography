"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getBookingById, updateBooking } from "@/lib/bookings";
import { createQuestionnaire } from "@/lib/questionnaires";
import { setBookingReminderMute } from "@/lib/reminder-rules";
import { REMINDER_KINDS, type ReminderKind } from "@/lib/reminder-rules";
import { createDraftAgreementAction } from "@/app/admin/(protected)/agreements/actions";
import { createGalleryRecord } from "@/app/admin/(protected)/galleries/actions";
import { isWeddingAgreementType } from "@/data/wedding-agreement";
import { formatMoney } from "@/lib/utils";
import { getInvoiceView } from "@/lib/invoice-data";

export type BookingContextResult = {
  ok: boolean;
  message: string;
  /** Where the admin should land next, when the action created something. */
  href?: string;
};

const TZ = "America/Toronto";

function revalidateBooking(id: string) {
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
}

/**
 * Start a contract from the booking, prefilled with what the booking already
 * knows.
 *
 * The workspace used to link out to the global Contracts page, where the
 * client, date, location and fee all had to be picked again from scratch --
 * for a job whose record was already open on screen.
 */
export async function createBookingContractAction(
  bookingId: string,
): Promise<BookingContextResult> {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "That booking no longer exists." };

  if (booking.agreement_request_id) {
    return {
      ok: true,
      message: "This booking already has a contract.",
      href: "/admin/agreements",
    };
  }

  const clientName = booking.client_name?.trim();
  if (!clientName) {
    return { ok: false, message: "Add a client name to the booking first." };
  }

  const start = booking.start_at ? new Date(booking.start_at) : null;
  const shootType = booking.shoot_type ?? "";
  const invoice = await getInvoiceView(booking);

  const result = await createDraftAgreementAction({
    galleryId: booking.gallery_id,
    clientName,
    clientEmail: booking.client_email,
    template: isWeddingAgreementType(shootType) ? "wedding" : "photography",
    type: shootType || null,
    total: invoice.total > 0 ? formatMoney(invoice.total) : null,
    date: start
      ? start.toLocaleDateString("en-CA", {
          timeZone: TZ,
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null,
    startTime: start
      ? start.toLocaleTimeString("en-CA", {
          timeZone: TZ,
          hour: "numeric",
          minute: "2-digit",
        })
      : null,
    location: booking.location,
  });

  if (!result.ok || !result.id) {
    return { ok: false, message: result.message };
  }

  // Link it back, so the workspace and the lifecycle strip pick it up.
  await updateBooking(bookingId, { agreementRequestId: result.id });
  revalidateBooking(bookingId);

  return {
    ok: true,
    message: "Contract drafted from this booking.",
    href: `/admin/agreements/${result.id}/edit`,
  };
}

/** Create a questionnaire already attached to this booking and client. */
export async function createBookingQuestionnaireAction(
  bookingId: string,
): Promise<BookingContextResult> {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "That booking no longer exists." };

  try {
    await createQuestionnaire({
      bookingId,
      galleryId: booking.gallery_id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
    });
    revalidateBooking(bookingId);
    revalidatePath("/admin/questionnaires");
    return {
      ok: true,
      message: "Questionnaire created for this client.",
      href: "/admin/questionnaires",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the questionnaire.",
    };
  }
}

/**
 * Create a delivery gallery for this booking and link the two.
 *
 * Reuses createGalleryQuick rather than re-implementing the insert, so preset
 * defaults, slug generation and cover defaults stay in one place.
 */
export async function createBookingGalleryAction(
  bookingId: string,
): Promise<BookingContextResult> {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "That booking no longer exists." };

  if (booking.gallery_id) {
    return {
      ok: true,
      message: "This booking already has a gallery.",
      href: `/admin/galleries/${booking.gallery_id}`,
    };
  }

  const title = booking.client_name?.trim() || booking.shoot_type?.trim();
  if (!title) {
    return { ok: false, message: "Add a client name to the booking first." };
  }

  const result = await createGalleryRecord({
    title,
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    location: booking.location,
    eventDate: booking.start_at ? new Date(booking.start_at).toISOString().slice(0, 10) : null,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  await updateBooking(bookingId, { galleryId: result.id });
  revalidateBooking(bookingId);
  revalidatePath("/admin/galleries");

  return {
    ok: true,
    message: "Gallery created and linked to this booking.",
    href: `/admin/galleries/${result.id}`,
  };
}

/** Skip or restore one automated reminder for this booking only. */
export async function setBookingReminderMuteAction(
  bookingId: string,
  kind: string,
  muted: boolean,
): Promise<BookingContextResult> {
  await requireAdmin();
  if (!(REMINDER_KINDS as string[]).includes(kind)) {
    return { ok: false, message: "Unknown reminder." };
  }
  try {
    await setBookingReminderMute(bookingId, kind as ReminderKind, muted);
    revalidateBooking(bookingId);
    return { ok: true, message: muted ? "Reminder skipped." : "Reminder restored." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update that reminder.",
    };
  }
}
