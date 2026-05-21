"use server";

import { revalidatePath } from "next/cache";
import { verifyPassword } from "@/lib/password";
import { grantGalleryAccess } from "@/lib/gallery-access";
import { hasPasswordProtectionConfig } from "@/lib/env";
import {
  RATE_LIMIT_CONFIG,
  countRecentFailures,
  getRequestIpHash,
  getRequestUserAgent,
  isRateLimited,
  recordAccessAttempt,
} from "@/lib/access-log";

export type UnlockState = {
  status: "idle" | "success" | "error";
  message: string;
};

const GENERIC_ERROR = "That password doesn't match. Try again.";
const UNAVAILABLE_ERROR = "This gallery is no longer available.";
const RATE_LIMIT_ERROR = "Too many attempts. Please wait a few minutes and try again.";

export async function unlockGallery(
  _previous: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  if (!hasPasswordProtectionConfig()) {
    return {
      status: "error",
      message:
        "Password protection is not configured on this site. The site admin needs to set GALLERY_ACCESS_SECRET and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const slug = String(formData.get("slug") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!slug || !password) {
    return { status: "error", message: GENERIC_ERROR };
  }

  // password_hash is never exposed publicly. Use the service-role client (only
  // available on the server) to look it up. This code path only fires on
  // password submit, never on normal viewing.
  const { getServiceRoleSupabaseClient } = await import("@/lib/supabase/admin");
  const admin = getServiceRoleSupabaseClient();
  const { data: gallery, error } = await admin
    .from("galleries")
    .select("id,password_hash,is_published,is_archived,expires_at")
    .eq("slug", slug)
    .maybeSingle();

  // Anything that prevents a real check returns the same generic error so we
  // don't leak existence/state of the gallery. Logs capture the real reason.
  if (error || !gallery) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const isUnavailable =
    !gallery.is_published ||
    gallery.is_archived ||
    (gallery.expires_at && new Date(gallery.expires_at) <= new Date());

  // Capture IP + UA once, reuse for rate-limit check and the log row.
  const [ipHash, userAgent] = await Promise.all([
    getRequestIpHash(),
    getRequestUserAgent(),
  ]);

  if (isUnavailable) {
    await recordAccessAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      success: false,
      reason: "unavailable_gallery",
    });
    return { status: "error", message: UNAVAILABLE_ERROR };
  }

  if (!gallery.password_hash) {
    // Gallery has no password — nothing to unlock. Don't log (this isn't an
    // attempt; the visitor simply navigated to a non-protected gallery).
    return { status: "success", message: "Gallery is open." };
  }

  // Rate limit BEFORE running scrypt. Avoid burning CPU on attackers.
  const failureCount = await countRecentFailures(gallery.id, ipHash);
  if (isRateLimited(failureCount)) {
    await recordAccessAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      success: false,
      reason: "rate_limited",
    });
    return { status: "error", message: RATE_LIMIT_ERROR };
  }

  const ok = await verifyPassword(password, gallery.password_hash);
  if (!ok) {
    await recordAccessAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      success: false,
      reason: "wrong_password",
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  await grantGalleryAccess(gallery.id);
  await recordAccessAttempt({
    galleryId: gallery.id,
    ipHash,
    userAgent,
    success: true,
    reason: "success",
  });
  revalidatePath(`/galleries/${slug}`);
  revalidatePath(`/galleries/${slug}/view`);
  return { status: "success", message: "Access granted." };
}

// Re-exported for tests / docs.
export const RATE_LIMIT_INFO = RATE_LIMIT_CONFIG;
