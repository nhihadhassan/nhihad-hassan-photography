"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { runReminders, type ReminderSummary } from "@/lib/reminders";

export async function setRemindersEnabledAction(enabled: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  const admin = getServiceRoleSupabaseClient();
  const { data: existing } = await admin.from("site_settings").select("id").limit(1).maybeSingle();
  if (existing?.id) {
    await admin.from("site_settings").update({ reminders_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await admin.from("site_settings").insert({ reminders_enabled: enabled, brand_name: "Nhihad Hassan Photography" });
  }
  revalidatePath("/admin/reminders");
  return { ok: true };
}

export async function runRemindersNowAction(): Promise<ReminderSummary> {
  await requireAdmin();
  return runReminders();
}
