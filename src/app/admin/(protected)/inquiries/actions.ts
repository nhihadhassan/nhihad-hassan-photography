"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { convertInquiryToBooking, setInquiryNote, setInquiryStatus } from "@/lib/inquiries";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/inquiry-lifecycle";

export type InquiryActionResult = {
  ok: boolean;
  message: string;
  bookingId?: string;
};

function revalidateInquirySurfaces() {
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
}

export async function updateInquiryStatusAction(
  id: string,
  status: string,
): Promise<InquiryActionResult> {
  await requireAdmin();
  if (!(INQUIRY_STATUSES as string[]).includes(status)) {
    return { ok: false, message: "Unknown status." };
  }
  try {
    await setInquiryStatus(id, status as InquiryStatus);
    revalidateInquirySurfaces();
    return { ok: true, message: "Status updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the status.",
    };
  }
}

export async function updateInquiryNoteAction(
  id: string,
  note: string,
): Promise<InquiryActionResult> {
  await requireAdmin();
  try {
    await setInquiryNote(id, note.trim() || null);
    revalidatePath("/admin/inquiries");
    return { ok: true, message: "Note saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not save the note.",
    };
  }
}

export async function convertInquiryAction(id: string): Promise<InquiryActionResult> {
  await requireAdmin();
  try {
    const result = await convertInquiryToBooking(id);
    if (!result.ok) return { ok: false, message: result.message };
    revalidateInquirySurfaces();
    revalidatePath("/admin/bookings");
    return {
      ok: true,
      message: result.alreadyConverted
        ? "This inquiry is already linked to a booking."
        : "Booking created from the inquiry.",
      bookingId: result.bookingId,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not convert this inquiry.",
    };
  }
}
