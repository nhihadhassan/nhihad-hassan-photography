"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteManyFromR2 } from "@/lib/r2";

const CATEGORIES = ["events", "nightlife", "portraits", "lifestyle", "weddings-couples"];
const ORIENTATIONS = ["portrait", "landscape", "square"];

function revalidatePortfolio() {
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath("/");
  for (const c of CATEGORIES) revalidatePath(`/portfolio/${c}`);
}

const emptyToNull = (value: FormDataEntryValue | null) => {
  const v = typeof value === "string" ? value.trim() : "";
  return v ? v : null;
};

export async function updatePortfolioItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const title = String(formData.get("title") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "");
  const orientationRaw = String(formData.get("orientation") ?? "");
  if (!title) return;

  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : "portraits";
  const orientation = ORIENTATIONS.includes(orientationRaw) ? orientationRaw : "portrait";

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("portfolio_items")
    .update({
      title,
      category,
      orientation,
      caption: emptyToNull(formData.get("caption")),
      alt: emptyToNull(formData.get("alt")),
      event_date: emptyToNull(formData.get("event_date")),
      location: emptyToNull(formData.get("location")),
      featured: formData.get("featured") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePortfolio();
}

export async function togglePortfolioHidden(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("portfolio_items")
    .update({ is_hidden: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePortfolio();
}

export async function togglePortfolioFeatured(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("portfolio_items")
    .update({ featured: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePortfolio();
}

export async function movePortfolioItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const supabase = await createSupabaseServerClient();
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (!items?.length) return;

  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return;

  const a = items[index];
  const b = items[swapIndex];
  await supabase.from("portfolio_items").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("portfolio_items").update({ sort_order: a.sort_order }).eq("id", b.id);
  revalidatePortfolio();
}

export async function deletePortfolioItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id,original_key,web_key,thumbnail_key")
    .eq("id", id)
    .maybeSingle();
  if (!item) return;

  await supabase.from("portfolio_items").delete().eq("id", id);
  const keys = [item.original_key, item.web_key, item.thumbnail_key].filter(
    (k): k is string => Boolean(k),
  );
  await deleteManyFromR2(keys).catch(() => undefined);
  revalidatePortfolio();
}

export async function savePortfolioOrder(formData: FormData) {
  await requireAdmin();
  const orderedIds = formData
    .getAll("item_ids")
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(Boolean);
  if (orderedIds.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase.from("portfolio_items").select("id");
  if (!rows?.length) return;
  const valid = new Set(rows.map((r) => r.id));
  const ids = orderedIds.filter((id) => valid.has(id));

  await Promise.all(
    ids.map((id, index) =>
      supabase.from("portfolio_items").update({ sort_order: index }).eq("id", id),
    ),
  );
  revalidatePortfolio();
}
