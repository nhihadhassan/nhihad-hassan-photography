import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import {
  ALLOWED_GALLERY_VIDEO_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_GALLERY_VIDEO_UPLOAD_BYTES,
  MAX_UPLOAD_BYTES,
  buildObjectKey,
  getSignedPutUrl,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

type PresignBody = {
  gallery_id?: string;
  filename?: string;
  content_type?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  /**
   * Which R2 folder the object belongs in. Defaults to "originals" (photos,
   * video files). The video upload flow also calls this route a second time
   * with "thumbnails" to presign the client-extracted poster JPEG — it isn't
   * a variant Sharp generated, but it belongs in the same folder as one.
   */
  variant?: "originals" | "thumbnails";
};

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return jsonError(401, "Sign in as an admin to upload photos.");

  if (!hasR2Config()) {
    return jsonError(503, "Photo storage is not configured.");
  }

  let body: PresignBody;
  try {
    body = (await request.json()) as PresignBody;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { gallery_id, filename, content_type, size, width, height, variant } = body;
  const objectVariant = variant === "thumbnails" ? "thumbnails" : "originals";

  if (!gallery_id) return jsonError(400, "Missing gallery_id.");
  if (!filename) return jsonError(400, "Missing filename.");
  if (!content_type) return jsonError(400, "Missing content_type.");
  if (!size || size <= 0) return jsonError(400, "Missing or invalid size.");

  // Gallery uploads accept photos (this route also carries video poster
  // JPEGs) and, separately, short video clips — each with its own size cap.
  // Journal/portfolio uploads use ALLOWED_MIME_TYPES/MAX_UPLOAD_BYTES
  // directly and never see video.
  const isImage = (ALLOWED_MIME_TYPES as readonly string[]).includes(content_type);
  const isVideo = (ALLOWED_GALLERY_VIDEO_MIME_TYPES as readonly string[]).includes(content_type);

  if (!isImage && !isVideo) {
    return jsonError(
      415,
      `Unsupported file type "${content_type}". Use JPG, PNG, WebP, MP4, or MOV.`,
    );
  }

  const maxBytes = isVideo ? MAX_GALLERY_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES;
  if (size > maxBytes) {
    return jsonError(413, `File is too large. Max ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .select("id")
    .eq("id", gallery_id)
    .maybeSingle();

  if (galleryError || !gallery) {
    return jsonError(404, "Gallery not found.");
  }

  const originalKey = buildObjectKey({ galleryId: gallery_id, variant: objectVariant, filename });

  const presignedUrl = await getSignedPutUrl(originalKey, content_type, 3600);

  return NextResponse.json({
    presigned_url: presignedUrl,
    original_key: originalKey,
    // Echo metadata back so the client can pass it straight to the process step
    gallery_id,
    filename,
    content_type,
    size,
    width: width ?? null,
    height: height ?? null,
  });
}
