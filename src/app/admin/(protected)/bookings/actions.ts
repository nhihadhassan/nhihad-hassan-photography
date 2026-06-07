"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createBooking,
  deleteBooking,
  getBookingById,
  updateBooking,
  type BookingInput,
} from "@/lib/bookings";
import { getAdminGallery } from "@/lib/admin-data";
import { torontoLocalToUtc } from "@/lib/ics";
import { sendBookingHubEmail } from "@/lib/notify-email";
import { siteUrl } from "@/lib/seo";

export type BookingActionState = {
  status: "idle" | "success" | "error";
  message: string;
  hubUrl?: string;
};

const clean = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

function inputFromForm(formData: FormData): BookingInput {
  const startLocal = typeof formData.get("start_local") === "string"
    ? String(formData.get("start_local")).trim()
    : "";
  const startUtc = startLocal ? torontoLocalToUtc(startLocal) : null;

  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const durationMin = durationRaw ? Number(durationRaw) : null;
  const endUtc =
    startUtc && durationMin && Number.isFinite(durationMin) && durationMin > 0
      ? new Date(startUtc.getTime() + durationMin * 60000)
      : null;

  return {
    galleryId: clean(formData.get("gallery_id")),
    agreementRequestId: clean(formData.get("agreement_request_id")),
    clientName: clean(formData.get("client_name")),
    clientEmail: clean(formData.get("client_email")),
    shootType: clean(formData.get("shoot_type")),
    startAt: startUtc ? startUtc.toISOString() : null,
    endAt: endUtc ? endUtc.toISOString() : null,
    location: clean(formData.get("location")),
    total: clean(formData.get("total")),
    deposit: clean(formData.get("deposit")),
    balance: clean(formData.get("balance")),
    notes: clean(formData.get("notes")),
    internalNote: clean(formData.get("internal_note")),
  };
}

function hubUrlFor(token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  return `${origin}/booking/${token}`;
}

export async function createBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  await requireAdmin();
  try {
    const { token } = await createBooking(inputFromForm(formData));
    revalidatePath("/admin/bookings");
    return { status: "success", message: "Booking created.", hubUrl: hubUrlFor(token) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create booking.",
    };
  }
}

export async function updateBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing booking id." };
  try {
    await updateBooking(id, inputFromForm(formData));
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    return { status: "success", message: "Booking saved." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save booking.",
    };
  }
}

/** Spin up a booking prefilled from a gallery, for editing before sending. */
export async function createGalleryBookingAction(
  galleryId: string,
): Promise<{ ok: boolean; message: string; id?: string }> {
  await requireAdmin();
  const gallery = await getAdminGallery(galleryId);
  if (!gallery) return { ok: false, message: "Gallery not found." };
  try {
    const startAt = gallery.event_date
      ? (torontoLocalToUtc(`${gallery.event_date}T12:00`)?.toISOString() ?? null)
      : null;
    const { id } = await createBooking({
      galleryId,
      clientName: gallery.client_name,
      clientEmail: gallery.client_email,
      shootType: gallery.title,
      startAt,
    });
    revalidatePath("/admin/bookings");
    return { ok: true, message: "Booking created.", id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create booking.",
    };
  }
}

/** Email the booking hub link to the client on file. */
export async function emailBookingHubAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const booking = await getBookingById(id);
  if (!booking) return { ok: false, message: "Booking not found." };
  if (!booking.client_email) {
    return { ok: false, message: "This booking has no client email. Add one first." };
  }
  const result = await sendBookingHubEmail({
    to: booking.client_email,
    clientName: booking.client_name,
    url: hubUrlFor(booking.token),
  });
  return { ok: result.ok, message: result.message };
}

export async function deleteBookingAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await deleteBooking(id);
    revalidatePath("/admin/bookings");
    return { ok: true, message: "Booking deleted." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete booking.",
    };
  }
}
