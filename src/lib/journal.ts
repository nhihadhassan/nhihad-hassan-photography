import "server-only";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey, hasR2Config } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";
import { journalPosts as staticPosts } from "@/data/journal";
import { portfolioItems } from "@/data/photography";
import type {
  JournalBlock,
  JournalListItem,
  JournalPostRecord,
  PublicJournalPost,
  ResolvedBlock,
} from "@/lib/journal-types";

// ── Static fallback (used until posts are seeded into the DB) ──────────────────
let staticId = 0;
function staticBodyToBlocks(body: string[]): JournalBlock[] {
  return body.map((line): JournalBlock => {
    const img = line.match(/^\[img:([a-z0-9-]+)(?:\|(.+))?\]$/);
    if (img) {
      const item = portfolioItems.find((p) => p.id === img[1]);
      return {
        id: `s${staticId++}`,
        type: "image",
        imageUrl: item?.imageUrl ?? `/portfolio/${img[1]}.webp`,
        alt: item?.alt ?? "",
        caption: img[2]?.trim() ?? "",
        width: "normal",
      };
    }
    return { id: `s${staticId++}`, type: "paragraph", text: line };
  });
}
function staticCover(coverImageId?: string) {
  const item = coverImageId ? portfolioItems.find((p) => p.id === coverImageId) : null;
  return { url: item?.imageUrl ?? null, alt: item?.alt ?? null };
}

const COLUMNS =
  "id,slug,title,excerpt,tag,post_date,cover_key,cover_url,cover_alt,content,accent_hex,body_font,published,sort_order,created_at,updated_at";

/** Resolve a single image reference (R2 key or direct URL) to a usable src. */
async function resolveSrc(key?: string | null, url?: string | null): Promise<string> {
  if (key && hasR2Config()) {
    const signed = await getSignedReadUrl(key);
    if (signed) return signed;
  }
  return url ?? "";
}

async function resolveBlocks(blocks: JournalBlock[]): Promise<ResolvedBlock[]> {
  return Promise.all(
    (blocks ?? []).map(async (block): Promise<ResolvedBlock> => {
      if (block.type === "image") {
        return { ...block, src: await resolveSrc(block.imageKey, block.imageUrl) };
      }
      if (block.type === "image_row") {
        const srcs = await Promise.all(
          (block.images ?? []).map(async (img) => ({
            src: await resolveSrc(img.imageKey, img.imageUrl),
            alt: img.alt,
          })),
        );
        return { ...block, srcs };
      }
      return block;
    }),
  );
}

function listItem(record: JournalPostRecord, coverUrl: string | null): JournalListItem {
  return {
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt ?? "",
    date: record.post_date,
    coverUrl,
    coverAlt: record.cover_alt ?? record.title,
  };
}

/** Published posts, newest first, for the journal listing (cover resolved). */
export async function getPublicJournalPosts(): Promise<JournalListItem[]> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("journal_posts")
    .select(COLUMNS)
    .eq("published", true)
    .order("post_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) {
    return staticPosts
      .filter((p) => p.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((p) => {
        const cover = staticCover(p.coverImageId);
        return {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          date: p.date,
          coverUrl: cover.url,
          coverAlt: cover.alt ?? p.title,
        };
      });
  }
  return Promise.all(
    (data as JournalPostRecord[]).map(async (r) =>
      listItem(r, await resolveSrc(r.cover_key, r.cover_url)),
    ),
  );
}

/** A single published post with everything resolved for rendering. */
export async function getPublicJournalPost(slug: string): Promise<PublicJournalPost | null> {
  const supabase = getPublicSupabaseClient();
  const { data } = supabase
    ? await supabase
        .from("journal_posts")
        .select(COLUMNS)
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()
    : { data: null };

  if (!data) {
    // Static fallback until posts are seeded.
    const p = staticPosts.find((s) => s.slug === slug && s.published);
    if (!p) return null;
    const cover = staticCover(p.coverImageId);
    return {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      tag: p.tag,
      date: p.date,
      coverUrl: cover.url,
      coverAlt: cover.alt ?? p.title,
      blocks: await resolveBlocks(staticBodyToBlocks(p.body)),
      accentHex: null,
      bodyFont: null,
    };
  }
  const r = data as JournalPostRecord;
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    tag: r.tag,
    date: r.post_date,
    coverUrl: await resolveSrc(r.cover_key, r.cover_url),
    coverAlt: r.cover_alt ?? r.title,
    blocks: await resolveBlocks(r.content ?? []),
    accentHex: r.accent_hex,
    bodyFont: r.body_font,
  };
}

/** All published slugs for static params. */
export async function getPublishedJournalSlugs(): Promise<string[]> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase.from("journal_posts").select("slug").eq("published", true);
  const slugs = (data ?? []).map((r) => r.slug as string);
  if (slugs.length > 0) return slugs;
  return staticPosts.filter((p) => p.published).map((p) => p.slug);
}

function adminClient() {
  return hasServiceRoleKey() ? getServiceRoleSupabaseClient() : null;
}

/** All posts (admin list). */
export async function getAdminJournalPosts(): Promise<JournalPostRecord[]> {
  const supabase = adminClient() ?? (await createSupabaseServerClient());
  const { data, error } = await supabase
    .from("journal_posts")
    .select(COLUMNS)
    .order("post_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as JournalPostRecord[];
}

/**
 * Fill each image block's `imageUrl` from its signed key so the editor can
 * preview uploaded images. Keys remain the source of truth on save.
 */
async function previewBlocks(blocks: JournalBlock[]): Promise<JournalBlock[]> {
  return Promise.all(
    (blocks ?? []).map(async (block): Promise<JournalBlock> => {
      if (block.type === "image" && block.imageKey) {
        return { ...block, imageUrl: await resolveSrc(block.imageKey, block.imageUrl) };
      }
      if (block.type === "image_row") {
        const images = await Promise.all(
          (block.images ?? []).map(async (img) =>
            img.imageKey ? { ...img, imageUrl: await resolveSrc(img.imageKey, img.imageUrl) } : img,
          ),
        );
        return { ...block, images };
      }
      return block;
    }),
  );
}

/** All posts with cover previews resolved, for the admin list. */
export async function getAdminJournalList(): Promise<
  { record: JournalPostRecord; coverUrl: string | null }[]
> {
  const records = await getAdminJournalPosts();
  return Promise.all(
    records.map(async (record) => ({
      record,
      coverUrl: await resolveSrc(record.cover_key, record.cover_url),
    })),
  );
}

/** A single post by id (admin editor), with cover + block previews resolved. */
export async function getAdminJournalPost(
  id: string,
): Promise<{ record: JournalPostRecord; coverUrl: string | null } | null> {
  const supabase = adminClient() ?? (await createSupabaseServerClient());
  const { data, error } = await supabase
    .from("journal_posts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as JournalPostRecord;
  const content = await previewBlocks(r.content ?? []);
  return { record: { ...r, content }, coverUrl: await resolveSrc(r.cover_key, r.cover_url) };
}
