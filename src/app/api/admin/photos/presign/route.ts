import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import {
  ALLOWED_MIME_TYPES,
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

  const { gallery_id, filename, content_type, size, width, height } = body;

  if (!gallery_id) return jsonError(400, "Missing gallery_id.");
  if (!filename) return jsonError(400, "Missing filename.");
  if (!content_type) return jsonError(400, "Missing content_type.");
  if (!size || size <= 0) return jsonError(400, "Missing or invalid size.");

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(content_type)) {
    return jsonError(415, `Unsupported file type "${content_type}". Use JPG, PNG, or WebP.`);
  }

  if (size > MAX_UPLOAD_BYTES) {
    return jsonError(
      413,
      `File is too large. Max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
    );
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

  const originalKey = buildObjectKey({ galleryId: gallery_id, variant: "originals", filename });

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
