import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { hasR2Config } from "@/lib/env";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  buildPortfolioKey,
  getSignedPutUrl,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

type PresignBody = {
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

  const { filename, content_type, size, width, height } = body;

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

  const originalKey = buildPortfolioKey({ variant: "originals", filename });
  const presignedUrl = await getSignedPutUrl(originalKey, content_type, 3600);

  return NextResponse.json({
    presigned_url: presignedUrl,
    original_key: originalKey,
    filename,
    content_type,
    size,
    width: width ?? null,
    height: height ?? null,
  });
}
