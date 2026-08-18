/**
 * POST /api/admin/photos/process
 *
 * Called by the client AFTER a successful direct-to-R2 upload via a presigned
 * PUT URL. Branches on content_type:
 *
 *  - Image: downloads the original from R2, generates web + thumbnail
 *    variants with Sharp, uploads those variants, and inserts the row.
 *  - Video: never downloaded here. Uploads are not transcoded, so there is
 *    nothing for this function to do with the bytes — it only HEADs the
 *    original (and poster, if the client extracted one) to confirm they
 *    landed, then inserts the row. This keeps a 500 MB video out of a
 *    serverless function's memory entirely.
 *
 * This route never receives raw file bytes itself — only small JSON
 * metadata — so it is unaffected by Vercel's request body size limits either
 * way.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import {
  ALLOWED_GALLERY_VIDEO_MIME_TYPES,
  buildObjectKey,
  deleteManyFromR2,
  downloadFromR2,
  headObjectMeta,
  uploadToR2,
} from "@/lib/r2";
import {
  deriveWebpFilename,
  generateThumbnailVariant,
  generateWebVariant,
} from "@/lib/image-processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Sharp + R2 download/upload can take a while for large originals. The video
// path only does two HEAD requests, so it's well within this either way.
export const maxDuration = 120;

type ProcessBody = {
  gallery_id?: string;
  original_key?: string;
  filename?: string;
  content_type?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  /** Video only: R2 key of a poster JPEG the client extracted, if it succeeded. */
  poster_key?: string | null;
  /** Video only: length in seconds, read from the file's own metadata client-side. */
  duration_seconds?: number | null;
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

  const {
    gallery_id,
    original_key,
    filename,
    content_type,
    size,
    width,
    height,
    poster_key,
    duration_seconds,
  } = body;

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

  const isVideo = (ALLOWED_GALLERY_VIDEO_MIME_TYPES as readonly string[]).includes(content_type);

  if (isVideo) {
    return processVideo(supabase, {
      gallery_id,
      original_key,
      filename,
      content_type,
      size,
      width: width ?? null,
      height: height ?? null,
      poster_key: poster_key ?? null,
      duration_seconds: duration_seconds ?? null,
    });
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
      media_type: "image",
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

async function nextSortOrderFor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  galleryId: string,
) {
  const { data: countRow } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (countRow?.sort_order ?? -1) + 1;
}

async function processVideo(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: {
    gallery_id: string;
    original_key: string;
    filename: string;
    content_type: string;
    size?: number;
    width: number | null;
    height: number | null;
    poster_key: string | null;
    duration_seconds: number | null;
  },
) {
  const { gallery_id, original_key, filename, content_type, size, width, height, poster_key, duration_seconds } =
    input;

  // Confirm the direct-to-R2 PUT actually landed. The video itself is never
  // downloaded here — only a HEAD, so this costs nothing regardless of file
  // size — but skipping this check would let a failed client upload record a
  // photos row pointing at nothing.
  const originalMeta = await headObjectMeta(original_key);
  if (!originalMeta.exists) {
    return jsonError(502, "The video upload did not reach storage. Try again.");
  }

  let confirmedPosterKey: string | null = null;
  if (poster_key) {
    const posterMeta = await headObjectMeta(poster_key);
    // A missing poster is not fatal — the gallery just shows a generic video
    // card instead of a real frame — so this only clears the reference
    // rather than failing the whole upload.
    if (posterMeta.exists) confirmedPosterKey = poster_key;
  }

  const nextSortOrder = await nextSortOrderFor(supabase, gallery_id);

  const { data: inserted, error: insertError } = await supabase
    .from("photos")
    .insert({
      gallery_id,
      original_key,
      web_key: null,
      thumbnail_key: confirmedPosterKey,
      filename,
      width,
      height,
      size_bytes: size ?? originalMeta.size,
      mime_type: content_type,
      media_type: "video",
      duration_seconds,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertError) {
    // The video and poster stay in R2 — deleting a video the admin can see
    // succeeded uploading, just because the DB insert failed, would be a
    // worse failure mode than an orphaned object costing fractions of a cent.
    return jsonError(500, `Saved the video but failed to record it: ${insertError.message}`);
  }

  revalidatePath(`/admin/galleries/${gallery_id}`);
  revalidatePath(`/admin/galleries/${gallery_id}/photos`);

  return NextResponse.json({
    id: inserted.id,
    original_key,
    web_key: null,
    thumbnail_key: confirmedPosterKey,
    filename,
  });
}
