/**
 * POST /api/admin/journal/migrate
 *
 * One-time, admin-only, idempotent seed: copies the static journal posts
 * (src/data/journal.ts) into the journal_posts table, converting each body
 * string into a typed block (paragraph, or image for "[img:id|caption]"
 * markers). Safe to re-run; existing slugs are skipped.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { journalPosts } from "@/data/journal";
import { portfolioItems } from "@/data/photography";
import type { JournalBlock } from "@/lib/journal-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bodyToBlocks(body: string[]): JournalBlock[] {
  return body.map((line): JournalBlock => {
    const img = line.match(/^\[img:([a-z0-9-]+)(?:\|(.+))?\]$/);
    if (img) {
      const item = portfolioItems.find((p) => p.id === img[1]);
      return {
        id: randomUUID(),
        type: "image",
        imageUrl: item?.imageUrl ?? `/portfolio/${img[1]}.webp`,
        alt: item?.alt ?? "",
        caption: img[2]?.trim() ?? "",
        width: "normal",
      };
    }
    return { id: randomUUID(), type: "paragraph", text: line };
  });
}

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("journal_posts").select("slug");
  const have = new Set((existing ?? []).map((r) => r.slug as string));

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < journalPosts.length; i++) {
    const post = journalPosts[i];
    if (have.has(post.slug)) {
      skipped++;
      continue;
    }
    const cover = post.coverImageId
      ? portfolioItems.find((p) => p.id === post.coverImageId)
      : null;

    const { error } = await supabase.from("journal_posts").insert({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      tag: post.tag,
      post_date: post.date,
      cover_url: cover?.imageUrl ?? null,
      cover_alt: cover?.alt ?? null,
      content: bodyToBlocks(post.body),
      published: post.published,
      sort_order: i,
    });
    if (error) errors.push(`${post.slug}: ${error.message}`);
    else imported++;
  }

  revalidatePath("/journal");
  revalidatePath("/admin/journal");

  return NextResponse.json({
    total: journalPosts.length,
    imported,
    skipped,
    errors: errors.slice(0, 10),
  });
}
