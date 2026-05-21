import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey } from "@/lib/env";

export type FavoriteSubmissionReason =
  | "success"
  | "validation_error"
  | "invalid_email"
  | "empty_selection"
  | "too_many_photos"
  | "no_valid_photos"
  | "unavailable_gallery"
  | "locked"
  | "rate_limited"
  | "error"
  | "not_configured";

const FAVORITE_RATE_LIMIT_WINDOW_MINUTES = 10;
const FAVORITE_RATE_LIMIT_THRESHOLD = 5;

export const FAVORITE_RATE_LIMIT = {
  windowMinutes: FAVORITE_RATE_LIMIT_WINDOW_MINUTES,
  threshold: FAVORITE_RATE_LIMIT_THRESHOLD,
} as const;

/**
 * Counts submission attempts in the rolling window for this (gallery, IP)
 * pair. All attempts (success or failure) count toward the limit so a
 * spammer sending invalid emails still gets rate-limited.
 */
export async function countRecentFavoriteAttempts(
  galleryId: string,
  ipHash: string,
): Promise<number> {
  if (!hasServiceRoleKey()) return 0;
  const since = new Date(
    Date.now() - FAVORITE_RATE_LIMIT_WINDOW_MINUTES * 60_000,
  ).toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { count } = await admin
    .from("favorite_submission_logs")
    .select("id", { count: "exact", head: true })
    .eq("gallery_id", galleryId)
    .eq("ip_hash", ipHash)
    .gte("accessed_at", since);
  return count ?? 0;
}

export function isFavoriteRateLimited(count: number): boolean {
  return count >= FAVORITE_RATE_LIMIT_THRESHOLD;
}

/**
 * Best-effort attempt logger. Never throws — a logging hiccup shouldn't
 * break the visitor's submission UX.
 */
export async function recordFavoriteAttempt(input: {
  galleryId: string | null;
  ipHash: string;
  userAgent: string | null;
  success: boolean;
  reason: FavoriteSubmissionReason;
}): Promise<void> {
  if (!hasServiceRoleKey()) return;
  try {
    const admin = getServiceRoleSupabaseClient();
    await admin.from("favorite_submission_logs").insert({
      gallery_id: input.galleryId,
      ip_hash: input.ipHash,
      user_agent: input.userAgent,
      success: input.success,
      reason: input.reason,
    });
  } catch {
    // intentional silent failure
  }
}
