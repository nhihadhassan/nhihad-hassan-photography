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
// Allow longer-running backfill work for large photos.
export const maxDuration = 60;

type ApiError = { error: string; code?: string };

function jsonError(status: number, body: ApiError) {
  return NextResponse.json(body, { status });
}

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) {
    return jsonError(401, { error: "Sign in as an admin." });
  }

  if (!hasR2Config()) {
    return jsonError(503, {
      error: "Photo storage is not configured.",
      code: "R2_NOT_CONFIGURED",
    });
  }

  const { id: photoId } = await params;
  if (!photoId) {
    return jsonError(400, { error: "Missing photo id." });
  }

  const supabase = await createSupabaseServerClient();

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select(
      "id,gallery_id,original_key,web_key,thumbnail_key,filename,mime_type",
    )
    .eq("id", photoId)
    .maybeSingle();

  if (photoError) {
    return jsonError(500, { error: photoError.message });
  }
  if (!photo) {
    return jsonError(404, { error: "Photo not found." });
  }

  if (photo.web_key && photo.thumbnail_key) {
    return NextResponse.json({ status: "skipped", id: photo.id });
  }

  let originalBuffer: Buffer;
  try {
    originalBuffer = await downloadFromR2(photo.original_key);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not download original.";
    return jsonError(502, { error: `R2 download failed: ${message}` });
  }

  const webpName = deriveWebpFilename(photo.filename || "photo");
  const update: { web_key?: string; thumbnail_key?: string } = {};
  const uploadedKeys: string[] = [];

  try {
    if (!photo.web_key) {
      const web = await generateWebVariant(originalBuffer);
      const webKey = buildObjectKey({
        galleryId: photo.gallery_id,
        variant: "web",
        filename: webpName,
      });
      await uploadToR2({
        key: webKey,
        body: web.buffer,
        contentType: web.contentType,
      });
      uploadedKeys.push(webKey);
      update.web_key = webKey;
    }

    if (!photo.thumbnail_key) {
      const thumb = await generateThumbnailVariant(originalBuffer);
      const thumbKey = buildObjectKey({
        galleryId: photo.gallery_id,
        variant: "thumbnails",
        filename: webpName,
      });
      await uploadToR2({
        key: thumbKey,
        body: thumb.buffer,
        contentType: thumb.contentType,
      });
      uploadedKeys.push(thumbKey);
      update.thumbnail_key = thumbKey;
    }
  } catch (error) {
    await deleteManyFromR2(uploadedKeys).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Processing failed.";
    return jsonError(502, { error: `Variant generation failed: ${message}` });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ status: "skipped", id: photo.id });
  }

  const { error: updateError } = await supabase
    .from("photos")
    .update(update)
    .eq("id", photo.id);

  if (updateError) {
    await deleteManyFromR2(uploadedKeys).catch(() => undefined);
    return jsonError(500, {
      error: `Uploaded variants but failed to record: ${updateError.message}`,
    });
  }

  revalidatePath(`/admin/galleries/${photo.gallery_id}/photos`);

  return NextResponse.json({
    status: "ok",
    id: photo.id,
    web_key: update.web_key ?? photo.web_key,
    thumbnail_key: update.thumbnail_key ?? photo.thumbnail_key,
  });
}
