"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateBookingStage, BOOKING_STAGES, type BookingStage } from "@/lib/bookings";

export async function moveBookingStageAction(
  id: string,
  stage: string,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!(BOOKING_STAGES as string[]).includes(stage)) return { ok: false };
  try {
    await updateBookingStage(id, stage as BookingStage);
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
