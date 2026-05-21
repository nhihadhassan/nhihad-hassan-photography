import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  buildObjectKey,
  deleteManyFromR2,
  uploadToR2,
} from "@/lib/r2";
import {
  deriveWebpFilename,
  generateThumbnailVariant,
  generateWebVariant,
} from "@/lib/image-processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Uploads do Sharp image processing plus three R2 writes; give larger files
// enough room while staying conservative for Vercel Hobby limits.
export const maxDuration = 60;

type ApiError = { error: string; code?: string };

function jsonError(status: number, body: ApiError) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return jsonError(401, { error: "Sign in as an admin to upload photos." });
  }

  if (!hasR2Config()) {
    return jsonError(503, {
      error: "Photo storage is not configured. Add R2 credentials to .env.local.",
      code: "R2_NOT_CONFIGURED",
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, { error: "Invalid upload payload." });
  }

  const galleryId = String(formData.get("gallery_id") ?? "").trim();
  const file = formData.get("file");
  const widthRaw = formData.get("width");
  const heightRaw = formData.get("height");

  if (!galleryId) {
    return jsonError(400, { error: "Missing gallery_id." });
  }

  if (!(file instanceof File)) {
    return jsonError(400, { error: "Missing file." });
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return jsonError(415, {
      error: `Unsupported file type "${file.type || "unknown"}". Use JPG, PNG, or WebP.`,
    });
  }

  if (file.size <= 0) {
    return jsonError(400, { error: "Empty file." });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError(413, {
      error: `File is too large. Max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
    });
  }

  const supabase = await createSupabaseServerClient();

  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .select("id")
    .eq("id", galleryId)
    .maybeSingle();

  if (galleryError) {
    return jsonError(500, { error: galleryError.message });
  }

  if (!gallery) {
    return jsonError(404, { error: "Gallery not found." });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "photo";
  const webpName = deriveWebpFilename(filename);

  const originalKey = buildObjectKey({
    galleryId,
    variant: "originals",
    filename,
  });
  const webKey = buildObjectKey({
    galleryId,
    variant: "web",
    filename: webpName,
  });
  const thumbnailKey = buildObjectKey({
    galleryId,
    variant: "thumbnails",
    filename: webpName,
  });

  let webVariant;
  let thumbVariant;
  try {
    [webVariant, thumbVariant] = await Promise.all([
      generateWebVariant(buffer),
      generateThumbnailVariant(buffer),
    ]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not process image.";
    return jsonError(422, { error: `Image processing failed: ${message}` });
  }

  const uploadedKeys: string[] = [];
  try {
    await Promise.all([
      uploadToR2({ key: originalKey, body: buffer, contentType: file.type }).then(() =>
        uploadedKeys.push(originalKey),
      ),
      uploadToR2({
        key: webKey,
        body: webVariant.buffer,
        contentType: webVariant.contentType,
      }).then(() => uploadedKeys.push(webKey)),
      uploadToR2({
        key: thumbnailKey,
        body: thumbVariant.buffer,
        contentType: thumbVariant.contentType,
      }).then(() => uploadedKeys.push(thumbnailKey)),
    ]);
  } catch (error) {
    await deleteManyFromR2(uploadedKeys).catch(() => undefined);
    const message = error instanceof Error ? error.message : "R2 upload failed.";
    return jsonError(502, { error: `Upload failed: ${message}` });
  }

  const widthFromClient = widthRaw ? Number(widthRaw) : null;
  const heightFromClient = heightRaw ? Number(heightRaw) : null;
  const width =
    widthFromClient && Number.isFinite(widthFromClient)
      ? widthFromClient
      : webVariant.width;
  const height =
    heightFromClient && Number.isFinite(heightFromClient)
      ? heightFromClient
      : webVariant.height;

  const { data: countRow } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (countRow?.sort_order ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("photos")
    .insert({
      gallery_id: galleryId,
      original_key: originalKey,
      web_key: webKey,
      thumbnail_key: thumbnailKey,
      filename,
      width,
      height,
      size_bytes: file.size,
      mime_type: file.type,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertError) {
    await deleteManyFromR2(uploadedKeys).catch(() => undefined);
    return jsonError(500, {
      error: `Saved files but failed to record: ${insertError.message}`,
    });
  }

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/admin/galleries/${galleryId}/photos`);

  return NextResponse.json({
    id: inserted.id,
    original_key: originalKey,
    web_key: webKey,
    thumbnail_key: thumbnailKey,
    filename,
  });
}
