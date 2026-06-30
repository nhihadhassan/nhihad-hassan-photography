"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { PricingCategory, PricingTier } from "@/data/pricing";

function parseCategories(raw: string): PricingCategory[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: PricingCategory[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const label = typeof c.label === "string" ? c.label.trim() : "";
    const rawTiers = Array.isArray(c.tiers) ? c.tiers : [];
    const tiers: PricingTier[] = [];
    for (const tv of rawTiers) {
      if (!tv || typeof tv !== "object") continue;
      const t = tv as Record<string, unknown>;
      const name = typeof t.name === "string" ? t.name.trim() : "";
      const price = typeof t.price === "string" ? t.price.trim() : "";
      if (!name && !price) continue;
      const includes = Array.isArray(t.includes)
        ? t.includes.filter((i): i is string => typeof i === "string").map((i) => i.trim()).filter(Boolean)
        : [];
      const details = typeof t.details === "string" ? t.details.trim() : "";
      tiers.push({ name, price, duration: typeof t.duration === "string" ? t.duration.trim() : "", includes, ...(details ? { details } : {}) });
    }
    if (!label && tiers.length === 0) continue;
    const note = typeof c.note === "string" ? c.note.trim() : "";
    out.push({ id: "", label, blurb: typeof c.blurb === "string" ? c.blurb.trim() : "", ...(note ? { note } : {}), tiers });
  }
  return out;
}

export async function savePricing(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceRoleSupabaseClient();
  const categories = parseCategories(String(formData.get("categories") ?? "[]"));

  const payload = { categories, updated_at: new Date().toISOString() };
  const { data: existing } = await supabase.from("pricing_content").select("id").limit(1).maybeSingle();
  if (existing?.id) {
    await supabase.from("pricing_content").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("pricing_content").insert(payload);
  }

  revalidatePath("/pricing");
  revalidatePath("/admin/pricing");
}
