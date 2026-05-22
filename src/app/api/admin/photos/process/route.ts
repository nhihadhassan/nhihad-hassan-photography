/**
 * POST /api/admin/photos/process
 *
 * Called by the client AFTER a successful direct-to-R2 upload via a presigned
 * PUT URL. Downloads the original from R2, generates web + thumbnail variants
 * with Sharp, uploads those variants, and inserts the photos row.
 *
 * This route never receives the raw image — only small JSON metadata — so it
 * is unaffected by Vercel's request body size limits.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import {
  buildObjectKey,
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
// Sharp + R2 download/upload can take a while for large originals.
export const maxDuration = 120;

type ProcessBody = {
  gallery_id?: string;
  original_key?: string;
  filename?: string;
  content_type?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
};

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
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

  const { gallery_id, original_key, filename, content_type, size, width, height } = body;

  if (!gallery_id) return jsonError(400, "Missing gallery_id.");
  if (!original_key) return jsonError(400, "Missing original_key.");
  if (!filename) return jsonError(400, "Missing filename.");
  if (!content_type) return jsonError(400, "Missing content_type.");

  const supabase = await createSupabaseServerClient();

  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .select("id,watermark_enabled")
    .eq("id", gallery_id)
    .maybeSingle();

  if (galleryError || !gallery) {
    return jsonError(404, "Gallery not found.");
  }

  // Download the original from R2 (no Vercel body limit — this is a server read).
  let buffer: Buffer;
  try {
    buffer = await downloadFromR2(original_key);
  } catch (err) {
    const message = err instanceof Error ? err.message : "R2 download failed.";
    return jsonError(502, `Could not retrieve uploaded file: ${message}`);
  }

  const webpName = deriveWebpFilename(filename);
  const webKey = buildObjectKey({ galleryId: gallery_id, variant: "web", filename: webpName });
  const thumbnailKey = buildObjectKey({
    galleryId: gallery_id,
    variant: "thumbnails",
    filename: webpName,
  });

  const watermarkEnabled = Boolean(gallery.watermark_enabled);

  let webVariant;
  let thumbVariant;
  try {
    [webVariant, thumbVariant] = await Promise.all([
      generateWebVariant(buffer, { watermark: watermarkEnabled }),
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

  const widthValue =
    width && Number.isFinite(width) ? width : webVariant.width;
  const heightValue =
    height && Number.isFinite(height) ? height : webVariant.height;

  const { data: countRow } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("gallery_id", gallery_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (countRow?.sort_order ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("photos")
    .insert({
      gallery_id,
      original_key,
      web_key: webKey,
      thumbnail_key: thumbnailKey,
      filename,
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

  revalidatePath(`/admin/galleries/${gallery_id}`);
  revalidatePath(`/admin/galleries/${gallery_id}/photos`);

  return NextResponse.json({
    id: inserted.id,
    original_key,
    web_key: webKey,
    thumbnail_key: thumbnailKey,
    filename,
  });
}
