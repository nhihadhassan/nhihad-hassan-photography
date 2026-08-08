"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateClientProfileOverride } from "@/lib/clients";

export async function updateClientProfileAction(
  key: string,
  input: { name: string; email: string; phone: string; address: string; notes: string },
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    if (!input.name.trim()) {
      return { ok: false, message: "Enter a name." };
    }
    await updateClientProfileOverride(key, input);
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${encodeURIComponent(key)}`);
    return { ok: true, message: "Saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Couldn't save.",
    };
  }
}
