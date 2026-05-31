import "server-only";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey } from "@/lib/env";

export type BlockType = "text" | "image" | "cta" | "gallery_strip";

export type PageBlock = {
  id: string;
  page_slug: string;
  block_type: BlockType;
  content: Record<string, unknown>;
  sort_order: number;
  is_hidden: boolean;
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Text block",
  image: "Image",
  cta: "Call to action",
  gallery_strip: "Featured photos strip",
};

const COLUMNS = "id,page_slug,block_type,content,sort_order,is_hidden";

function str(content: Record<string, unknown>, key: string): string {
  const v = content[key];
  return typeof v === "string" ? v : "";
}

/** Typed string accessor for a block's content field. */
export function blockText(block: PageBlock, key: string): string {
  return str(block.content ?? {}, key);
}

/** Visible blocks for a page, ordered. Cookie-less so pages stay static/ISR. */
export async function getPublicPageBlocks(pageSlug = "home"): Promise<PageBlock[]> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("page_blocks")
    .select(COLUMNS)
    .eq("page_slug", pageSlug)
    .eq("is_hidden", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as PageBlock[];
}

/** All blocks (including hidden) for the admin manager. */
export async function getAdminPageBlocks(pageSlug = "home"): Promise<PageBlock[]> {
  const supabase = hasServiceRoleKey()
    ? getServiceRoleSupabaseClient()
    : await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("page_blocks")
    .select(COLUMNS)
    .eq("page_slug", pageSlug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PageBlock[];
}
