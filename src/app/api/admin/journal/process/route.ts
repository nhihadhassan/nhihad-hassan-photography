/**
 * POST /api/admin/journal/process
 *
 * Called after a successful direct-to-R2 upload of a journal image. Downloads
 * the original, generates a single web variant (no watermark), uploads it, and
 * returns the stored key plus a signed preview URL. No DB row is created; the
 * key is embedded in the post's block content when the post is saved.
 */
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { hasR2Config } from "@/lib/env";
import {
  buildJournalKey,
  deleteManyFromR2,
  downloadFromR2,
  getSignedReadUrl,
  uploadToR2,
} from "@/lib/r2";
import { deriveWebpFilename, generateWebVariant } from "@/lib/image-processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type ProcessBody = {
  original_key?: string;
  filename?: string;
};

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return jsonError(401, "Sign in as an admin.");
  if (!hasR2Config()) return jsonError(503, "Photo storage is not configured.");

  let body: ProcessBody;
  try {
    body = (await request.json()) as ProcessBody;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { original_key, filename } = body;
  if (!original_key) return jsonError(400, "Missing original_key.");
  if (!filename) return jsonError(400, "Missing filename.");

  let buffer: Buffer;
  try {
    buffer = await downloadFromR2(original_key);
  } catch (err) {
    const message = err instanceof Error ? err.message : "R2 download failed.";
    return jsonError(502, `Could not retrieve uploaded file: ${message}`);
  }

  const webpName = deriveWebpFilename(filename);
  const webKey = buildJournalKey({ variant: "web", filename: webpName });

  let webVariant;
  try {
    webVariant = await generateWebVariant(buffer, { watermark: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image processing failed.";
    return jsonError(422, `Image processing failed: ${message}`);
  }

  try {
    await uploadToR2({ key: webKey, body: webVariant.buffer, contentType: webVariant.contentType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "R2 upload failed.";
    return jsonError(502, `Variant upload failed: ${message}`);
  }

  // Clean up the original; we only keep the optimized web variant for journal images.
  await deleteManyFromR2([original_key]).catch(() => undefined);

  const url = await getSignedReadUrl(webKey);

  return NextResponse.json({ key: webKey, url });
}
