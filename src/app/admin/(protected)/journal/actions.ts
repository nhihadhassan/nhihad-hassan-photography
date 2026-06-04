"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteManyFromR2 } from "@/lib/r2";
import { slugify } from "@/lib/utils";
import { JOURNAL_TAGS } from "@/lib/journal-types";
import type { JournalBlock } from "@/lib/journal-types";

const TAG_VALUES = new Set(JOURNAL_TAGS.map((t) => t.value));
const FONT_VALUES = new Set(["serif", "sans"]);

function revalidateJournal(slug?: string | null) {
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath("/");
  if (slug) revalidatePath(`/journal/${slug}`);
}

const emptyToNull = (value: FormDataEntryValue | null) => {
  const v = typeof value === "string" ? value.trim() : "";
  return v ? v : null;
};

/** Collect every R2 object key referenced by a post (cover + block images). */
function collectKeys(coverKey: string | null, content: JournalBlock[]): string[] {
  const keys: string[] = [];
  if (coverKey) keys.push(coverKey);
  for (const block of content) {
    if (block.type === "image" && block.imageKey) keys.push(block.imageKey);
    if (block.type === "image_row") {
      for (const img of block.images ?? []) {
        if (img.imageKey) keys.push(img.imageKey);
      }
    }
  }
  return keys;
}

/** Ensure a slug is unique, appending -2, -3, ... if needed. */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || "post";
  let candidate = root;
  let n = 1;
  // Loop until no conflicting row exists.
  for (;;) {
    let query = supabase.from("journal_posts").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

/** Create a fresh draft and open it in the editor. */
export async function createJournalPost() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const slug = await uniqueSlug(supabase, `untitled-${Date.now().toString(36)}`);
  const { data: top } = await supabase
    .from("journal_posts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = (top?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("journal_posts")
    .insert({
      slug,
      title: "Untitled post",
      content: [],
      published: false,
      sort_order: nextSort,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create post.");
  revalidateJournal();
  redirect(`/admin/journal/${data.id}`);
}

/** Save all editable fields for a post, including its block content. */
export async function saveJournalPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();

  const title = String(formData.get("title") ?? "").trim() || "Untitled post";
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = await uniqueSlug(supabase, slugInput || title, id);

  const tagRaw = String(formData.get("tag") ?? "");
  const tag = TAG_VALUES.has(tagRaw) ? tagRaw : null;

  const fontRaw = String(formData.get("body_font") ?? "");
  const bodyFont = FONT_VALUES.has(fontRaw) ? fontRaw : null;

  const accentRaw = String(formData.get("accent_hex") ?? "").trim();
  const accentHex = /^#[0-9a-fA-F]{6}$/.test(accentRaw) ? accentRaw.toLowerCase() : null;

  let content: JournalBlock[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("content") ?? "[]"));
    if (Array.isArray(parsed)) content = parsed as JournalBlock[];
  } catch {
    content = [];
  }

  await supabase
    .from("journal_posts")
    .update({
      title,
      slug,
      excerpt: emptyToNull(formData.get("excerpt")),
      tag,
      post_date: emptyToNull(formData.get("post_date")) ?? new Date().toISOString().slice(0, 10),
      cover_key: emptyToNull(formData.get("cover_key")),
      cover_url: emptyToNull(formData.get("cover_url")),
      cover_alt: emptyToNull(formData.get("cover_alt")),
      content,
      accent_hex: accentHex,
      body_font: bodyFont,
      published: formData.get("published") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidateJournal(slug);
  redirect("/admin/journal");
}

export async function togglePublished(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("journal_posts")
    .update({ published: next, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .maybeSingle();
  revalidateJournal(data?.slug);
}

export async function moveJournalPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("journal_posts")
    .select("id,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (!rows?.length) return;

  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= rows.length) return;

  const a = rows[index];
  const b = rows[swapIndex];
  await supabase.from("journal_posts").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("journal_posts").update({ sort_order: a.sort_order }).eq("id", b.id);
  revalidateJournal();
}

export async function deleteJournalPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("journal_posts")
    .select("cover_key,content")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("journal_posts").delete().eq("id", id);

  if (post) {
    const keys = collectKeys(
      (post.cover_key as string | null) ?? null,
      (post.content as JournalBlock[]) ?? [],
    );
    if (keys.length) await deleteManyFromR2(keys).catch(() => undefined);
  }
  revalidateJournal();
}
