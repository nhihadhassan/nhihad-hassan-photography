import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey } from "@/lib/env";

export type DownloadScope = "all" | "selects";
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
const DOWNLOAD_RATE_LIMIT_THRESHOLD = 10;

export const DOWNLOAD_RATE_LIMIT = {
  windowMinutes: DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES,
  threshold: DOWNLOAD_RATE_LIMIT_THRESHOLD,
} as const;

/**
 * Counts download attempts in the rolling window for this (gallery, IP) pair.
 * ALL attempts count toward the limit — successful big-file downloads are the
 * abuse case, not just failures.
 */
export async function countRecentDownloads(
  galleryId: string,
  ipHash: string,
): Promise<number> {
  if (!hasServiceRoleKey()) return 0;
  const since = new Date(
    Date.now() - DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES * 60_000,
  ).toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { count } = await admin
    .from("gallery_download_logs")
    .select("id", { count: "exact", head: true })
    .eq("gallery_id", galleryId)
    .eq("ip_hash", ipHash)
    .gte("accessed_at", since);
  return count ?? 0;
}

export function isDownloadRateLimited(count: number): boolean {
  return count >= DOWNLOAD_RATE_LIMIT_THRESHOLD;
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
