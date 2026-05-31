"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlockType } from "@/lib/page-blocks";

const BLOCK_TYPES: BlockType[] = ["text", "image", "cta", "gallery_strip"];

// Which content keys belong to each block type.
const TYPE_KEYS: Record<BlockType, string[]> = {
  text: ["eyebrow", "heading", "body"],
  cta: ["heading", "buttonLabel", "buttonHref"],
  image: ["imageUrl", "alt", "caption"],
  gallery_strip: ["heading"],
};

function revalidate(pageSlug: string) {
  revalidatePath("/admin/sections");
  if (pageSlug === "home") revalidatePath("/");
}

export async function addBlock(formData: FormData) {
  await requireAdmin();
  const pageSlug = String(formData.get("page_slug") ?? "home") || "home";
  const typeRaw = String(formData.get("block_type") ?? "");
  const blockType = (BLOCK_TYPES as string[]).includes(typeRaw) ? (typeRaw as BlockType) : null;
  if (!blockType) return;

  const supabase = await createSupabaseServerClient();
  const { data: last } = await supabase
    .from("page_blocks")
    .select("sort_order")
    .eq("page_slug", pageSlug)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  await supabase.from("page_blocks").insert({
    page_slug: pageSlug,
    block_type: blockType,
    content: {},
    sort_order: nextSortOrder,
  });
  revalidate(pageSlug);
}

export async function updateBlock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pageSlug = String(formData.get("page_slug") ?? "home") || "home";
  const typeRaw = String(formData.get("block_type") ?? "");
  const blockType = (BLOCK_TYPES as string[]).includes(typeRaw) ? (typeRaw as BlockType) : null;
  if (!id || !blockType) return;

  const content: Record<string, string> = {};
  for (const key of TYPE_KEYS[blockType]) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) content[key] = value;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("page_blocks")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidate(pageSlug);
}

export async function toggleBlockHidden(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pageSlug = String(formData.get("page_slug") ?? "home") || "home";
  const next = formData.get("next") === "true";
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("page_blocks")
    .update({ is_hidden: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidate(pageSlug);
}

export async function moveBlock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pageSlug = String(formData.get("page_slug") ?? "home") || "home";
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const supabase = await createSupabaseServerClient();
  const { data: blocks } = await supabase
    .from("page_blocks")
    .select("id,sort_order")
    .eq("page_slug", pageSlug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (!blocks?.length) return;

  const index = blocks.findIndex((b) => b.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= blocks.length) return;

  const a = blocks[index];
  const b = blocks[swapIndex];
  await supabase.from("page_blocks").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("page_blocks").update({ sort_order: a.sort_order }).eq("id", b.id);
  revalidate(pageSlug);
}

export async function deleteBlock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pageSlug = String(formData.get("page_slug") ?? "home") || "home";
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("page_blocks").delete().eq("id", id);
  revalidate(pageSlug);
}
