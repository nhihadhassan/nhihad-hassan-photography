import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
  hasGalleryAccessSecret,
  hasServiceRoleKey,
  requireGalleryAccessSecret,
} from "@/lib/env";

export type AccessLogReason =
  | "success"
  | "wrong_password"
  | "rate_limited"
  | "unavailable_gallery"
  | "not_configured";

const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_THRESHOLD = 5;
const USER_AGENT_MAX = 256;

/**
 * Extracts the client IP from request headers. Returns the literal string
 * "unknown" if no proxy/forwarding header is set (typical in local dev).
 * The value is only ever consumed by hashIp(); the raw IP is never stored.
 */
async function readClientIp(): Promise<string> {
  const h = await headers();
  const candidates = [
    h.get("cf-connecting-ip"),
    h.get("x-vercel-forwarded-for"),
    h.get("x-forwarded-for"),
    h.get("x-real-ip"),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/**
 * One-way hash of the IP using GALLERY_ACCESS_SECRET. We never store the raw IP.
 * The first 16 hex chars are kept — enough entropy for per-IP rate limiting
 * and short enough to display in the admin UI.
 */
function hashIpWithSecret(ip: string): string {
  const secret = requireGalleryAccessSecret();
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 16);
}

export async function getRequestIpHash(): Promise<string> {
  if (!hasGalleryAccessSecret()) {
    // Degraded mode — no secret means no real rate limit, but still avoid
    // returning the raw IP. Use a stable placeholder so all unkeyed traffic
    // shares one bucket (still better than no tracking).
    return "no-secret";
  }
  const ip = await readClientIp();
  return hashIpWithSecret(ip);
}

export async function getRequestUserAgent(): Promise<string | null> {
  const h = await headers();
  const ua = h.get("user-agent");
  if (!ua) return null;
  return ua.length > USER_AGENT_MAX ? ua.slice(0, USER_AGENT_MAX) : ua;
}

/**
 * Counts failed attempts in the rolling window for this (gallery, IP) pair.
 * Returns 0 if the schema/service-role isn't available — fail open for now.
 */
export async function countRecentFailures(
  galleryId: string,
  ipHash: string,
): Promise<number> {
  if (!hasServiceRoleKey()) return 0;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { count } = await admin
    .from("gallery_access_logs")
    .select("id", { count: "exact", head: true })
    .eq("gallery_id", galleryId)
    .eq("ip_hash", ipHash)
    .eq("success", false)
    .gte("accessed_at", since);
  return count ?? 0;
}

export function isRateLimited(failureCount: number): boolean {
  return failureCount >= RATE_LIMIT_THRESHOLD;
}

export const RATE_LIMIT_CONFIG = {
  windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
  threshold: RATE_LIMIT_THRESHOLD,
} as const;

/**
 * Writes one access log row. Never persists plaintext passwords, raw IPs,
 * or any of the secret material used to compute the IP hash. Best-effort —
 * a logging failure does NOT block the user's request.
 */
export async function recordAccessAttempt(input: {
  galleryId: string;
  ipHash: string;
  userAgent: string | null;
  success: boolean;
  reason: AccessLogReason;
  visitorName?: string | null;
  visitorEmail?: string | null;
}): Promise<void> {
  if (!hasServiceRoleKey()) return;
  try {
    const admin = getServiceRoleSupabaseClient();
    await admin.from("gallery_access_logs").insert({
      gallery_id: input.galleryId,
      ip_hash: input.ipHash,
      user_agent: input.userAgent,
      success: input.success,
      reason: input.reason,
      visitor_name: input.visitorName ?? null,
      visitor_email: input.visitorEmail ?? null,
    });
  } catch {
    // Intentionally silent. We don't want a logging hiccup to break unlock UX.
  }
}
