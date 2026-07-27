import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey } from "@/lib/env";

export type DownloadScope = "all" | "selects" | "single";
export type DownloadReason =
  | "success"
  | "not_enabled"
  | "locked"
  | "unavailable_gallery"
  | "empty"
  | "error"
  | "rate_limited"
  | "not_configured";

const DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES = 10;
const DOWNLOAD_RATE_LIMITS = {
  all: { windowMinutes: DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES, threshold: 10 },
  selects: { windowMinutes: DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES, threshold: 10 },
  // Individual images are much cheaper than a streamed ZIP, and clients may
  // reasonably download a larger set one photo at a time from the lightbox.
  single: { windowMinutes: DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES, threshold: 60 },
} as const satisfies Record<DownloadScope, { windowMinutes: number; threshold: number }>;

export function getDownloadRateLimit(scope: DownloadScope) {
  return DOWNLOAD_RATE_LIMITS[scope];
}

/**
 * Counts download attempts in the rolling window for this (gallery, IP, scope)
 * bucket.
 * ALL attempts count toward the limit — successful big-file downloads are the
 * abuse case, not just failures.
 */
export async function countRecentDownloads(
  galleryId: string,
  ipHash: string,
  scope: DownloadScope,
): Promise<number> {
  if (!hasServiceRoleKey()) return 0;
  const rateLimit = getDownloadRateLimit(scope);
  const since = new Date(
    Date.now() - rateLimit.windowMinutes * 60_000,
  ).toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { count } = await admin
    .from("gallery_download_logs")
    .select("id", { count: "exact", head: true })
    .eq("gallery_id", galleryId)
    .eq("ip_hash", ipHash)
    .eq("scope", scope)
    .gte("accessed_at", since);
  return count ?? 0;
}

export function isDownloadRateLimited(count: number, scope: DownloadScope): boolean {
  return count >= getDownloadRateLimit(scope).threshold;
}

/**
 * Writes one download log row. Best-effort — a logging failure does NOT
 * block the user's download response.
 */
export async function recordDownloadAttempt(input: {
  galleryId: string;
  ipHash: string;
  userAgent: string | null;
  scope: DownloadScope;
  photoCount: number;
  success: boolean;
  reason: DownloadReason;
}): Promise<void> {
  if (!hasServiceRoleKey()) return;
  try {
    const admin = getServiceRoleSupabaseClient();
    await admin.from("gallery_download_logs").insert({
      gallery_id: input.galleryId,
      ip_hash: input.ipHash,
      user_agent: input.userAgent,
      scope: input.scope,
      photo_count: input.photoCount,
      success: input.success,
      reason: input.reason,
    });
  } catch {
    // intentional silent failure
  }
}
