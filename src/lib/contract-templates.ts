import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { AgreementSection } from "@/data/booking-agreement";

export type ContractTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string;
  agreementTitle: string;
  intro: string;
  sections: AgreementSection[];
  supportsSecondSigner: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function sanitizeSections(value: unknown): AgreementSection[] {
  if (!Array.isArray(value)) return [];
  const sections: AgreementSection[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const heading =
      typeof (item as { heading?: unknown }).heading === "string"
        ? (item as { heading: string }).heading
        : "";
    const rawClauses = (item as { clauses?: unknown }).clauses;
    const clauses = Array.isArray(rawClauses)
      ? rawClauses.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      : [];
    if (heading.trim() || clauses.length) sections.push({ heading, clauses });
  }
  return sections;
}

function mapTemplate(row: Record<string, unknown>): ContractTemplate {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string | null) ?? "",
    agreementTitle: String(row.agreement_title),
    intro: (row.intro as string | null) ?? "",
    sections: sanitizeSections(row.sections),
    supportsSecondSigner: Boolean(row.supports_second_signer),
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Every non-archived template, newest edits first — the admin templates list. */
export async function listContractTemplates(): Promise<ContractTemplate[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("contract_templates")
    .select("*")
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapTemplate);
}

export async function getContractTemplateById(id: string): Promise<ContractTemplate | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("contract_templates").select("*").eq("id", id).maybeSingle();
  return data ? mapTemplate(data as Record<string, unknown>) : null;
}

/** Used by the live agreement renderer (booking-agreement.ts) to find a template by its slug. */
export async function getContractTemplateBySlug(slug: string): Promise<ContractTemplate | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin
    .from("contract_templates")
    .select("*")
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();
  return data ? mapTemplate(data as Record<string, unknown>) : null;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return base || "template";
}

async function uniqueSlug(admin: ReturnType<typeof getServiceRoleSupabaseClient>, base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  while (true) {
    const { data } = await admin.from("contract_templates").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export async function createContractTemplate(input: {
  name: string;
  description?: string;
  agreementTitle?: string;
}): Promise<ContractTemplate> {
  const admin = getServiceRoleSupabaseClient();
  const slug = await uniqueSlug(admin, slugify(input.name));
  const { data, error } = await admin
    .from("contract_templates")
    .insert({
      slug,
      name: input.name,
      description: input.description ?? "",
      agreement_title: input.agreementTitle ?? input.name,
      intro:
        "THIS AGREEMENT is made as of {{effectiveDate}} (the “Effective Date”) between {{clientName}}, with a mailing address of {{clientAddress}}, email {{clientEmail}}, and phone {{clientPhone}} (the “Client”), and {{photographerBusinessName}} (the “Photographer”).",
      sections: [{ heading: "1. Services", clauses: ["1.1 The Photographer agrees to provide the services described in this Agreement."] }],
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create template.");
  return mapTemplate(data as Record<string, unknown>);
}

export async function duplicateContractTemplate(id: string): Promise<ContractTemplate> {
  const source = await getContractTemplateById(id);
  if (!source) throw new Error("Template not found.");
  const admin = getServiceRoleSupabaseClient();
  const name = `${source.name} (copy)`;
  const slug = await uniqueSlug(admin, slugify(name));
  const { data, error } = await admin
    .from("contract_templates")
    .insert({
      slug,
      name,
      description: source.description,
      agreement_title: source.agreementTitle,
      intro: source.intro,
      sections: source.sections,
      supports_second_signer: source.supportsSecondSigner,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not duplicate template.");
  return mapTemplate(data as Record<string, unknown>);
}

export async function updateContractTemplate(
  id: string,
  input: {
    name?: string;
    description?: string;
    agreementTitle?: string;
    intro?: string;
    sections?: AgreementSection[];
    supportsSecondSigner?: boolean;
  },
): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.agreementTitle !== undefined) payload.agreement_title = input.agreementTitle;
  if (input.intro !== undefined) payload.intro = input.intro;
  if (input.sections !== undefined) payload.sections = sanitizeSections(input.sections);
  if (input.supportsSecondSigner !== undefined) payload.supports_second_signer = input.supportsSecondSigner;

  const { error } = await admin.from("contract_templates").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function renameContractTemplate(id: string, name: string): Promise<void> {
  await updateContractTemplate(id, { name });
}

export async function archiveContractTemplate(id: string): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("contract_templates")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
