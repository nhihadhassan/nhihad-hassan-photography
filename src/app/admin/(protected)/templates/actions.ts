"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  archiveContractTemplate,
  createContractTemplate,
  duplicateContractTemplate,
  renameContractTemplate,
  updateContractTemplate,
} from "@/lib/contract-templates";
import type { AgreementSection } from "@/data/booking-agreement";

export async function createTemplateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const template = await createContractTemplate({ name });
  revalidatePath("/admin/templates");
  redirect(`/admin/templates/${template.id}`);
}

export async function duplicateTemplateAction(id: string): Promise<{ ok: boolean; message: string; id?: string }> {
  await requireAdmin();
  try {
    const copy = await duplicateContractTemplate(id);
    revalidatePath("/admin/templates");
    return { ok: true, message: `Duplicated as "${copy.name}".`, id: copy.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not duplicate template." };
  }
}

export async function renameTemplateAction(id: string, name: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, message: "Name is too short." };
  try {
    await renameContractTemplate(id, trimmed);
    revalidatePath("/admin/templates");
    revalidatePath(`/admin/templates/${id}`);
    return { ok: true, message: "Renamed." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not rename template." };
  }
}

export async function archiveTemplateAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await archiveContractTemplate(id);
    revalidatePath("/admin/templates");
    return { ok: true, message: "Template archived." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not archive template." };
  }
}

export type SaveTemplateInput = {
  name: string;
  description: string;
  agreementTitle: string;
  intro: string;
  sections: AgreementSection[];
  supportsSecondSigner: boolean;
};

/** Autosave target: no redirect, no navigation revalidation beyond the editor itself. */
export async function saveTemplateAction(
  id: string,
  input: SaveTemplateInput,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await updateContractTemplate(id, input);
    revalidatePath(`/admin/templates/${id}`);
    return { ok: true, message: "Saved" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save." };
  }
}
