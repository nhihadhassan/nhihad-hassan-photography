import "server-only";
import { cache } from "react";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import {
  pricingCategories as staticCategories,
  type PricingCategory,
  type PricingTier,
} from "@/data/pricing";
import { slugify } from "@/lib/utils";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function sanitizeTier(value: unknown): PricingTier | null {
  if (!value || typeof value !== "object") return null;
  const t = value as Record<string, unknown>;
  const name = str(t.name).trim();
  const price = str(t.price).trim();
  if (!name && !price) return null;
  const includes = Array.isArray(t.includes)
    ? t.includes.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    : [];
  const details = str(t.details).trim();
  return {
    name,
    price,
    duration: str(t.duration).trim(),
    includes,
    ...(details ? { details } : {}),
  };
}

function sanitizeCategories(value: unknown): PricingCategory[] {
  if (!Array.isArray(value)) return [];
  const out: PricingCategory[] = [];
  value.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const c = item as Record<string, unknown>;
    const label = str(c.label).trim();
    const tiers = Array.isArray(c.tiers)
      ? c.tiers.map(sanitizeTier).filter((t): t is PricingTier => t !== null)
      : [];
    if (!label && tiers.length === 0) return;
    const note = str(c.note).trim();
    out.push({
      id: slugify(label) || `category-${i + 1}`,
      label,
      blurb: str(c.blurb).trim(),
      ...(note ? { note } : {}),
      tiers,
    });
  });
  return out;
}

/** Pricing categories: the edited row if present, otherwise static defaults. */
export const getPricing = cache(async (): Promise<PricingCategory[]> => {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return staticCategories;
    const { data } = await supabase
      .from("pricing_content")
      .select("categories")
      .limit(1)
      .maybeSingle();
    if (!data) return staticCategories;
    const cats = sanitizeCategories(data.categories);
    return cats.length ? cats : staticCategories;
  } catch {
    return staticCategories;
  }
});
