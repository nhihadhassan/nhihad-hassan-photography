/**
 * POST /api/admin/portfolio/migrate
 *
 * One-time, admin-only, idempotent seed: copies the static portfolio items
 * (src/data/photography.ts + /public/portfolio/*.webp) into R2 + the
 * portfolio_items table so they become editable. Runs in production where R2
 * credentials exist (they are not set locally). Safe to re-run — already
 * imported items (matched by legacy_public_path) are skipped, so a timeout can
 * be resumed by calling again.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import { buildPortfolioKey, deleteManyFromR2, uploadToR2 } from "@/lib/r2";
import { portfolioItems } from "@/data/photography";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return jsonError(401, "Sign in as an admin.");
  if (!hasR2Config()) return jsonError(503, "Photo storage is not configured.");

  const origin = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("portfolio_items")
    .select("legacy_public_path");
  const done = new Set(
    (existing ?? []).map((r) => r.legacy_public_path).filter((p): p is string => Boolean(p)),
  );

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < portfolioItems.length; i++) {
    const item = portfolioItems[i];
    const legacyPath = item.imageUrl; // "/portfolio/{id}.webp"
    if (done.has(legacyPath)) {
      skipped++;
      continue;
    }

    const base = `${item.id}.webp`;
    const webKey = buildPortfolioKey({ variant: "web", filename: base });
    const thumbKey = buildPortfolioKey({ variant: "thumbnails", filename: base });

    try {
      const webUrl = `${origin}${item.imageUrl}`;
      const thumbUrl = `${origin}${item.imageUrl.replace(/\.webp$/, "-thumb.webp")}`;
      const [webRes, thumbRes] = await Promise.all([fetch(webUrl), fetch(thumbUrl)]);
      if (!webRes.ok) throw new Error(`fetch web failed (${webRes.status})`);
      const webBuf = Buffer.from(await webRes.arrayBuffer());
      const thumbBuf = thumbRes.ok ? Buffer.from(await thumbRes.arrayBuffer()) : webBuf;

      await Promise.all([
        uploadToR2({ key: webKey, body: webBuf, contentType: "image/webp" }),
        uploadToR2({ key: thumbKey, body: thumbBuf, contentType: "image/webp" }),
      ]);

      const { error } = await supabase.from("portfolio_items").insert({
        original_key: webKey,
        web_key: webKey,
        thumbnail_key: thumbKey,
        title: item.title,
        category: item.category,
        caption: item.description ?? null,
        alt: item.alt ?? null,
        event_date: item.date ?? null,
        location: item.location ?? null,
        featured: item.featured ?? false,
        orientation: item.orientation ?? "portrait",
        mime_type: "image/webp",
        size_bytes: webBuf.length,
        sort_order: i,
        legacy_public_path: legacyPath,
      });
      if (error) {
        await deleteManyFromR2([webKey, thumbKey]).catch(() => undefined);
        throw new Error(error.message);
      }
      imported++;
    } catch (e) {
      failed++;
      errors.push(`${item.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  revalidatePath("/portfolio");
  revalidatePath("/admin/portfolio");
  revalidatePath("/");

  return NextResponse.json({
    total: portfolioItems.length,
    imported,
    skipped,
    failed,
    remaining: portfolioItems.length - (imported + skipped),
    errors: errors.slice(0, 10),
  });
}
