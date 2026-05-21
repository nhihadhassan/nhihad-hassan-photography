import { NextResponse } from "next/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasGalleryAccess } from "@/lib/gallery-access";
import { hasR2Config, hasServiceRoleKey } from "@/lib/env";
import {
  buildArchivePaths,
  buildZipFilename,
  streamGalleryZip,
  type DownloadablePhoto,
} from "@/lib/download";
import { getRequestIpHash, getRequestUserAgent } from "@/lib/access-log";
import {
  DOWNLOAD_RATE_LIMIT,
  countRecentDownloads,
  isDownloadRateLimited,
  recordDownloadAttempt,
  type DownloadScope,
} from "@/lib/download-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Bulk downloads of large galleries can take a while. Vercel's plan tier
// caps this; locally it's effectively unlimited.
export const maxDuration = 300;

type Params = { params: Promise<{ slug: string }> };

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

const MAX_SELECT_IDS = 500;

export async function POST(request: Request, { params }: Params) {
  if (!hasServiceRoleKey() || !hasR2Config()) {
    return jsonError(503, "Downloads aren't configured on this site.");
  }

  const { slug } = await params;
  if (!slug) return jsonError(400, "Missing gallery slug.");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "Invalid form payload.");
  }

  const scopeRaw = String(formData.get("scope") ?? "").trim();
  const scope: DownloadScope =
    scopeRaw === "all" ? "all" : scopeRaw === "selects" ? "selects" : (null as never);
  if (scope === null) return jsonError(400, "Unknown download scope.");

  const submittedIds = formData
    .getAll("photo_ids")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);

  if (scope === "selects" && submittedIds.length === 0) {
    return jsonError(400, "No photos selected.");
  }
  if (scope === "selects" && submittedIds.length > MAX_SELECT_IDS) {
    return jsonError(413, `Too many photos. Maximum ${MAX_SELECT_IDS} per download.`);
  }

  const [ipHash, userAgent] = await Promise.all([
    getRequestIpHash(),
    getRequestUserAgent(),
  ]);

  const admin = getServiceRoleSupabaseClient();

  const { data: gallery, error: galleryError } = await admin
    .from("galleries")
    .select("id,is_published,is_archived,expires_at,password_hash,download_enabled,download_quality")
    .eq("slug", slug)
    .maybeSingle();

  if (galleryError || !gallery) {
    return jsonError(404, "Gallery not found.");
  }

  // Rate limit BEFORE any expensive work (R2 reads, ZIP streaming).
  const recentCount = await countRecentDownloads(gallery.id, ipHash);
  if (isDownloadRateLimited(recentCount)) {
    await recordDownloadAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      scope,
      photoCount: 0,
      success: false,
      reason: "rate_limited",
    });
    return jsonError(
      429,
      `Too many download attempts. Please wait a few minutes (limit: ${DOWNLOAD_RATE_LIMIT.threshold} per ${DOWNLOAD_RATE_LIMIT.windowMinutes} minutes).`,
    );
  }

  const isUnavailable =
    !gallery.is_published ||
    gallery.is_archived ||
    (gallery.expires_at && new Date(gallery.expires_at) <= new Date());
  if (isUnavailable) {
    await recordDownloadAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      scope,
      photoCount: 0,
      success: false,
      reason: "unavailable_gallery",
    });
    return jsonError(410, "This gallery is no longer available.");
  }

  if (!gallery.download_enabled) {
    await recordDownloadAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      scope,
      photoCount: 0,
      success: false,
      reason: "not_enabled",
    });
    return jsonError(403, "Downloads aren't enabled for this gallery.");
  }

  if (gallery.password_hash) {
    const unlocked = await hasGalleryAccess(gallery.id);
    if (!unlocked) {
      await recordDownloadAttempt({
        galleryId: gallery.id,
        ipHash,
        userAgent,
        scope,
        photoCount: 0,
        success: false,
        reason: "locked",
      });
      return jsonError(401, "Enter the gallery password before downloading.");
    }
  }

  // Resolve photos
  let query = admin
    .from("photos")
    .select("id,filename,original_key,web_key,sort_order")
    .eq("gallery_id", gallery.id)
    .eq("is_hidden", false);

  if (scope === "selects") {
    query = query.in("id", submittedIds);
  }

  const { data: photoRows, error: photoErr } = await query;
  if (photoErr) {
    await recordDownloadAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      scope,
      photoCount: 0,
      success: false,
      reason: "error",
    });
    return jsonError(500, "Could not load photos for download.");
  }

  const photos: DownloadablePhoto[] = (photoRows ?? []).map((p) => ({
    id: p.id as string,
    filename: (p.filename as string) ?? "photo",
    originalKey: p.original_key as string,
    webKey: (p.web_key as string | null) ?? null,
    sortOrder: (p.sort_order as number) ?? 0,
  }));

  if (photos.length === 0) {
    await recordDownloadAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      scope,
      photoCount: 0,
      success: false,
      reason: "empty",
    });
    return jsonError(400, "No photos available for this download.");
  }

  const quality = (gallery.download_quality as "web" | "full") ?? "web";
  const entries = buildArchivePaths(photos);
  const zipFilename = buildZipFilename(slug, scope);
  const stream = streamGalleryZip({ entries, quality });

  // Log success now — the stream starts. If it errors mid-flight, the
  // client sees a truncated ZIP; we log the start either way.
  await recordDownloadAttempt({
    galleryId: gallery.id,
    ipHash,
    userAgent,
    scope,
    photoCount: photos.length,
    success: true,
    reason: "success",
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
