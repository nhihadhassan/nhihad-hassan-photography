"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createQuestionnaire, revokeQuestionnaire } from "@/lib/questionnaires";
import { getBookingById } from "@/lib/bookings";
import { siteUrl } from "@/lib/seo";

export type QuestionnaireActionState = {
  status: "idle" | "success" | "error";
  message: string;
  url?: string;
};

const clean = (v: FormDataEntryValue | null) => {
  const t = typeof v === "string" ? v.trim() : "";
  return t || null;
};

function urlFor(token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  return `${origin}/questionnaire/${token}`;
}

export async function createQuestionnaireAction(
  _prev: QuestionnaireActionState,
  formData: FormData,
): Promise<QuestionnaireActionState> {
  await requireAdmin();
  try {
    const { token } = await createQuestionnaire({
      bookingId: clean(formData.get("booking_id")),
      clientName: clean(formData.get("client_name")),
      clientEmail: clean(formData.get("client_email")),
      markSent: formData.get("mark_sent") === "on",
    });
    revalidatePath("/admin/questionnaires");
    return { status: "success", message: "Questionnaire link created.", url: urlFor(token) };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not create questionnaire." };
  }
}

export async function createBookingQuestionnaireAction(
  bookingId: string,
): Promise<{ ok: boolean; message: string; url?: string }> {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  if (!booking) return { ok: false, message: "Booking not found." };
  try {
    const { token } = await createQuestionnaire({
      bookingId,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      markSent: true,
    });
    revalidatePath("/admin/questionnaires");
    return { ok: true, message: "Questionnaire link created.", url: urlFor(token) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not create questionnaire." };
  }
}

export async function revokeQuestionnaireAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await revokeQuestionnaire(id);
    revalidatePath("/admin/questionnaires");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
