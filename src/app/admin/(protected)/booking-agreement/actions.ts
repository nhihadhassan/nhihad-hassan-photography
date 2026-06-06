"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { AgreementSection } from "@/data/booking-agreement";

function parseSections(raw: string): AgreementSection[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: AgreementSection[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const heading =
      typeof (item as { heading?: unknown }).heading === "string"
        ? (item as { heading: string }).heading.trim()
        : "";
    const rawClauses = (item as { clauses?: unknown }).clauses;
    const clauses = Array.isArray(rawClauses)
      ? rawClauses
          .filter((c): c is string => typeof c === "string")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
    if (heading || clauses.length) out.push({ heading, clauses });
  }
  return out;
}

export async function saveBookingAgreement(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceRoleSupabaseClient();

  const intro = String(formData.get("intro") ?? "").trim();
  const disclaimer = String(formData.get("disclaimer") ?? "").trim();
  const sections = parseSections(String(formData.get("sections") ?? "[]"));

  const payload = {
    intro: intro || null,
    disclaimer: disclaimer || null,
    sections,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("booking_agreement")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("booking_agreement").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("booking_agreement").insert(payload);
  }

  revalidatePath("/booking-agreement");
  revalidatePath("/admin/booking-agreement");
}
