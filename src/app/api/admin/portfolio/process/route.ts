/**
 * POST /api/admin/portfolio/process
 *
 * Called after a successful direct-to-R2 upload. Downloads the original,
 * generates web + thumbnail variants with Sharp, uploads them, and inserts a
 * portfolio_items row. Metadata (title, caption, etc.) is edited afterward in
 * the portfolio manager, matching the gallery upload-then-edit flow.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import {
  buildPortfolioKey,
  deleteManyFromR2,
  downloadFromR2,
  uploadToR2,
} from "@/lib/r2";
import {
  deriveWebpFilename,
  generateThumbnailVariant,
  generateWebVariant,
} from "@/lib/image-processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CATEGORIES = ["events", "nightlife", "portraits", "lifestyle", "weddings-couples"];

type ProcessBody = {
  original_key?: string;
  filename?: string;
  content_type?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  category?: string;
};

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function orientationFromDims(width: number, height: number): "portrait" | "landscape" | "square" {
  if (!width || !height) return "portrait";
  const ratio = width / height;
  if (ratio > 1.1) return "landscape";
  if (ratio < 0.9) return "portrait";
  return "square";
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return jsonError(401, "Sign in as an admin.");

  if (!hasR2Config()) {
    return jsonError(503, "Photo storage is not configured.");
  }

  let body: ProcessBody;
  try {
    body = (await request.json()) as ProcessBody;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { original_key, filename, content_type, size, width, height } = body;
  if (!original_key) return jsonError(400, "Missing original_key.");
  if (!filename) return jsonError(400, "Missing filename.");
  if (!content_type) return jsonError(400, "Missing content_type.");

  const category = CATEGORIES.includes(body.category ?? "") ? body.category! : "portraits";

  let buffer: Buffer;
  try {
    buffer = await downloadFromR2(original_key);
  } catch (err) {
    const message = err instanceof Error ? err.message : "R2 download failed.";
    return jsonError(502, `Could not retrieve uploaded file: ${message}`);
  }

  const webpName = deriveWebpFilename(filename);
  const webKey = buildPortfolioKey({ variant: "web", filename: webpName });
  const thumbnailKey = buildPortfolioKey({ variant: "thumbnails", filename: webpName });

  let webVariant;
  let thumbVariant;
  try {
    [webVariant, thumbVariant] = await Promise.all([
      generateWebVariant(buffer, { watermark: false }),
      generateThumbnailVariant(buffer),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image processing failed.";
    return jsonError(422, `Image processing failed: ${message}`);
  }

  const uploadedKeys: string[] = [];
  try {
    await Promise.all([
      uploadToR2({ key: webKey, body: webVariant.buffer, contentType: webVariant.contentType }).then(
        () => uploadedKeys.push(webKey),
      ),
      uploadToR2({
        key: thumbnailKey,
        body: thumbVariant.buffer,
        contentType: thumbVariant.contentType,
      }).then(() => uploadedKeys.push(thumbnailKey)),
    ]);
  } catch (err) {
    await deleteManyFromR2(uploadedKeys).catch(() => undefined);
    const message = err instanceof Error ? err.message : "R2 upload failed.";
    return jsonError(502, `Variant upload failed: ${message}`);
  }

  const widthValue = width && Number.isFinite(width) ? width : webVariant.width;
  const heightValue = height && Number.isFinite(height) ? height : webVariant.height;
  const orientation = orientationFromDims(widthValue ?? 0, heightValue ?? 0);

  // Default title from the filename (sans extension); admin edits it after.
  const baseTitle = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled";

  const supabase = await createSupabaseServerClient();

  const { data: countRow } = await supabase
    .from("portfolio_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (countRow?.sort_order ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("portfolio_items")
    .insert({
      original_key,
      web_key: webKey,
      thumbnail_key: thumbnailKey,
      title: baseTitle,
      category,
      alt: baseTitle,
      orientation,
      width: widthValue,
      height: heightValue,
      size_bytes: size ?? buffer.length,
      mime_type: content_type,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertError) {
    await deleteManyFromR2([webKey, thumbnailKey]).catch(() => undefined);
    return jsonError(500, `Saved files but failed to record: ${insertError.message}`);
  }

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");

  return NextResponse.json({ id: inserted.id });
}
