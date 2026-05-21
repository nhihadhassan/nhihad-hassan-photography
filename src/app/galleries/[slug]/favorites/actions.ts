"use server";

import { headers } from "next/headers";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey } from "@/lib/env";
import { hasGalleryAccess } from "@/lib/gallery-access";
import { sendSelectsNotification } from "@/lib/email";
import { getRequestIpHash, getRequestUserAgent } from "@/lib/access-log";
import {
  FAVORITE_RATE_LIMIT,
  countRecentFavoriteAttempts,
  isFavoriteRateLimited,
  recordFavoriteAttempt,
  type FavoriteSubmissionReason,
} from "@/lib/favorite-log";

export type SubmitFavoritesInput = {
  slug: string;
  visitorName?: string | null;
  visitorEmail: string;
  notes?: string | null;
  photoIds: string[];
};

export type SubmitFavoritesResult =
  | { status: "success"; setId: string; count: number; message: string }
  | { status: "error"; message: string };

const MAX_PHOTOS_PER_SET = 500;
const MAX_NOTES_LENGTH = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_ERROR = "We couldn't save your selects. Please try again.";
const RATE_LIMIT_ERROR = `Too many submission attempts. Please wait a few minutes (limit: ${FAVORITE_RATE_LIMIT.threshold} per ${FAVORITE_RATE_LIMIT.windowMinutes} minutes).`;

export async function submitFavorites(
  input: SubmitFavoritesInput,
): Promise<SubmitFavoritesResult> {
  if (!hasServiceRoleKey()) {
    return {
      status: "error",
      message: "Selects aren't configured on this site. Please contact the photographer.",
    };
  }

  // Capture request fingerprint once for the whole submission.
  const [ipHash, userAgent] = await Promise.all([
    getRequestIpHash(),
    getRequestUserAgent(),
  ]);

  const slug = input.slug?.trim();
  if (!slug) {
    // No slug → no gallery_id to attribute the attempt to. Don't log; return.
    return { status: "error", message: GENERIC_ERROR };
  }

  const admin = getServiceRoleSupabaseClient();

  // Resolve gallery first so we have a stable gallery_id for log + rate limit.
  const { data: gallery, error: galleryError } = await admin
    .from("galleries")
    .select("id,title,is_published,is_archived,expires_at,password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (galleryError || !gallery) {
    return { status: "error", message: GENERIC_ERROR };
  }

  // Helper: log this attempt and return the error response in one call.
  const fail = async (
    reason: FavoriteSubmissionReason,
    message: string,
  ): Promise<SubmitFavoritesResult> => {
    await recordFavoriteAttempt({
      galleryId: gallery.id,
      ipHash,
      userAgent,
      success: false,
      reason,
    });
    return { status: "error", message };
  };

  // Rate limit BEFORE running any further validation or DB writes.
  const recentCount = await countRecentFavoriteAttempts(gallery.id, ipHash);
  if (isFavoriteRateLimited(recentCount)) {
    return fail("rate_limited", RATE_LIMIT_ERROR);
  }

  // Validate inputs.
  const email = (input.visitorEmail ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return fail("invalid_email", "Please enter a valid email address.");
  }

  const name = input.visitorName?.trim() || null;
  const rawNotes = input.notes?.trim() || null;
  const notes =
    rawNotes && rawNotes.length > MAX_NOTES_LENGTH
      ? rawNotes.slice(0, MAX_NOTES_LENGTH)
      : rawNotes;

  const requestedIds = Array.from(new Set(input.photoIds ?? [])).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  if (requestedIds.length === 0) {
    return fail("empty_selection", "Pick at least one photo before submitting.");
  }
  if (requestedIds.length > MAX_PHOTOS_PER_SET) {
    return fail(
      "too_many_photos",
      `You can select up to ${MAX_PHOTOS_PER_SET} photos at a time.`,
    );
  }

  // Gallery availability.
  const isUnavailable =
    !gallery.is_published ||
    gallery.is_archived ||
    (gallery.expires_at && new Date(gallery.expires_at) <= new Date());
  if (isUnavailable) {
    return fail(
      "unavailable_gallery",
      "This gallery is no longer accepting selects.",
    );
  }

  if (gallery.password_hash) {
    const unlocked = await hasGalleryAccess(gallery.id);
    if (!unlocked) {
      return fail(
        "locked",
        "This gallery is locked. Please enter the password before submitting selects.",
      );
    }
  }

  // Photo validation: only IDs that belong to this gallery AND aren't hidden.
  const { data: validPhotos, error: photoError } = await admin
    .from("photos")
    .select("id,filename")
    .eq("gallery_id", gallery.id)
    .eq("is_hidden", false)
    .in("id", requestedIds);

  if (photoError) {
    return fail("error", GENERIC_ERROR);
  }

  const validRows = (validPhotos ?? []) as { id: string; filename: string }[];
  const validIds = validRows.map((p) => p.id);
  const validFilenames = validRows.map((p) => p.filename);
  if (validIds.length === 0) {
    return fail(
      "no_valid_photos",
      "None of the selected photos are available in this gallery.",
    );
  }

  // Insert favorite_set + favorite_photos.
  const nowIso = new Date().toISOString();
  const { data: setRow, error: setError } = await admin
    .from("favorite_sets")
    .insert({
      gallery_id: gallery.id,
      visitor_name: name,
      visitor_email: email,
      notes,
      submitted_at: nowIso,
    })
    .select("id")
    .single();

  if (setError || !setRow) {
    return fail("error", GENERIC_ERROR);
  }

  const rows = validIds.map((photo_id) => ({
    favorite_set_id: setRow.id as string,
    photo_id,
  }));

  const { error: photosError } = await admin.from("favorite_photos").insert(rows);
  if (photosError) {
    // Best-effort cleanup so we don't leave an orphan set with 0 photos.
    await admin.from("favorite_sets").delete().eq("id", setRow.id);
    return fail("error", GENERIC_ERROR);
  }

  // Log success.
  await recordFavoriteAttempt({
    galleryId: gallery.id,
    ipHash,
    userAgent,
    success: true,
    reason: "success",
  });

  // Best-effort email notification — never blocks/rolls back the submission.
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const adminUrl = `${proto}://${host}/admin/galleries/${gallery.id}/favorites?set=${setRow.id}`;
    await sendSelectsNotification({
      galleryTitle: gallery.title,
      gallerySlug: slug,
      galleryId: gallery.id,
      visitorName: name,
      visitorEmail: email,
      notes,
      filenames: validFilenames,
      submittedAt: new Date(nowIso),
      adminUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.warn(`[submit-favorites] notification step threw: ${message}`);
  }

  return {
    status: "success",
    setId: setRow.id as string,
    count: validIds.length,
    message: "Your selects have been sent.",
  };
}
