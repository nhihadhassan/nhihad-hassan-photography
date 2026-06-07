"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createBooking, deleteBooking, updateBooking, type BookingInput } from "@/lib/bookings";
import { torontoLocalToUtc } from "@/lib/ics";
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

function isoFromLocal(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const date = torontoLocalToUtc(text);
  return date ? date.toISOString() : null;
}

function inputFromForm(formData: FormData): BookingInput {
  return {
    galleryId: clean(formData.get("gallery_id")),
    agreementRequestId: clean(formData.get("agreement_request_id")),
    clientName: clean(formData.get("client_name")),
    clientEmail: clean(formData.get("client_email")),
    shootType: clean(formData.get("shoot_type")),
    startAt: isoFromLocal(formData.get("start_local")),
    endAt: isoFromLocal(formData.get("end_local")),
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
