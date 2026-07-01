import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSignedReadUrl, getPublicImageUrl } from "@/lib/r2";
import { hasR2Config } from "@/lib/env";
import type { DepositStatus } from "@/lib/payment-constants";

export type { DepositStatus } from "@/lib/payment-constants";
export { DEPOSIT_STATUS_LABELS } from "@/lib/payment-constants";

export type GalleryRecord = {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  client_email: string | null;
  event_date: string | null;
  description: string | null;
  location: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_photo_id: string | null;
  /** Cover image object-position percentages (0-100). */
  cover_focal_x: number;
  cover_focal_y: number;
  /** Cover layout template: center | left | bottom | split. */
  cover_layout: string;
  is_public: boolean;
  is_published: boolean;
  is_archived: boolean;
  download_enabled: boolean;
  download_quality: "web" | "full";
  deposit_status: DepositStatus;
  payment_notes: string | null;
  expires_at: string | null;
  /** True when a password_hash is set. password_hash itself is never returned. */
  has_password: boolean;
  /** Stored for use in gallery invite emails only. Admin-only — never exposed publicly. */
  password_plain: string | null;
  /** True when a download_pin_hash is set. The hash itself is never returned. */
  has_download_pin: boolean;
  /** Max successful full-gallery downloads (null = unlimited). */
  download_limit: number | null;
  /** Count of successful full-gallery downloads so far. */
  download_count: number;
  /** When true, web display variants have a text watermark composited in. */
  watermark_enabled: boolean;
  /** Saved invite email subject override (null = use default). Admin-only. */
  invite_subject: string | null;
  /** Saved invite email message override (null = use default). Admin-only. */
  invite_message: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryInviteLogEntry = {
  id: string;
  gallery_id: string;
  sent_to: string;
  sent_at: string;
  resend_message_id: string | null;
};

type GalleryRow = Omit<GalleryRecord, "has_password" | "has_download_pin"> & {
  password_hash: string | null;
  download_pin_hash: string | null;
  watermark_enabled: boolean;
};

function withHasPassword(row: GalleryRow): GalleryRecord {
  const { password_hash, download_pin_hash, ...rest } = row;
  return {
    ...rest,
    has_password: Boolean(password_hash),
    has_download_pin: Boolean(download_pin_hash),
  };
}

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  budget: string | null;
  referral_source: string | null;
  message: string;
  created_at: string;
};

const GALLERY_COLUMNS =
  "id,title,slug,client_name,client_email,event_date,description,location,cover_image_url,cover_image_alt,cover_photo_id,cover_focal_x,cover_focal_y,cover_layout,is_public,is_published,is_archived,download_enabled,download_quality,download_pin_hash,download_limit,download_count,watermark_enabled,invite_subject,invite_message,deposit_status,payment_notes,expires_at,password_hash,password_plain,created_at,updated_at";

export async function getAdminGalleries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("galleries")
    .select(GALLERY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as GalleryRow[]).map(withHasPassword);
}

export type GalleryListItem = GalleryRecord & { photo_count: number };

/**
 * Galleries for the admin list view, each with its total photo count (used to
 * show "N items" on the card grid). Service role bypasses RLS so the embedded
 * count is accurate. Kept separate from getAdminGalleries so the many other
 * callers of that function are unaffected.
 */
export async function getAdminGalleriesWithCounts(): Promise<GalleryListItem[]> {
  const supabase = await createSupabaseServerClient();
  // Disambiguate the embed: galleries<->photos has two FKs (photos.gallery_id
  // and galleries.cover_photo_id). We want the count of photos belonging to the
  // gallery, i.e. the photos.gallery_id relationship.
  const { data, error } = await supabase
    .from("galleries")
    .select(`${GALLERY_COLUMNS},photos!photos_gallery_id_fkey(count)`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as (GalleryRow & { photos?: { count: number }[] })[]).map((row) => {
    const { photos, ...rest } = row;
    return { ...withHasPassword(rest as GalleryRow), photo_count: photos?.[0]?.count ?? 0 };
  });
}

export async function getAdminGallery(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("galleries")
    .select(GALLERY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? withHasPassword(data as GalleryRow) : null;
}

/**
 * Resolves the R2 object key for a gallery's cover image, mirroring the public
 * cover fallback order: chosen cover photo, then the first visible photo.
 * Returns null when there is no usable photo (or R2 is unconfigured).
 */
async function resolveGalleryCoverKey(gallery: GalleryRecord): Promise<string | null> {
  if (!hasR2Config()) return null;
  const supabase = await createSupabaseServerClient();

  if (gallery.cover_photo_id) {
    const { data: photo } = await supabase
      .from("photos")
      .select("web_key,thumbnail_key")
      .eq("id", gallery.cover_photo_id)
      .maybeSingle();
    const key = (photo?.web_key as string | null) ?? (photo?.thumbnail_key as string | null) ?? null;
    if (key) return key;
  }

  const { data: first } = await supabase
    .from("photos")
    .select("web_key,thumbnail_key")
    .eq("gallery_id", gallery.id)
    .eq("is_hidden", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (first?.web_key as string | null) ?? (first?.thumbnail_key as string | null) ?? null;
}

/**
 * Resolves the cover image to show in the admin focal-point picker, mirroring
 * the public cover fallback order: explicit URL, then the chosen cover photo,
 * then the first visible photo. Uses a short-lived signed URL (admin-only view).
 */
export async function getGalleryCoverPreviewUrl(gallery: GalleryRecord): Promise<string | null> {
  if (gallery.cover_image_url) return gallery.cover_image_url;
  const key = await resolveGalleryCoverKey(gallery);
  return key ? getSignedReadUrl(key) : null;
}

/**
 * Cover image URL safe to embed in an email — a permanent public URL when R2
 * public access is configured, otherwise a long-lived (7-day) signed URL so the
 * image survives being opened later. Falls back to the explicit cover URL.
 */
export async function getGalleryEmailCoverUrl(gallery: GalleryRecord): Promise<string | null> {
  if (gallery.cover_image_url) return gallery.cover_image_url;
  const key = await resolveGalleryCoverKey(gallery);
  return key ? getPublicImageUrl(key) : null;
}

/**
 * Resolves cover thumbnails for a list of galleries in a bounded number of
 * queries (previously N+1: two per gallery). One query batches the chosen cover
 * photos; a second batches the first visible photo for galleries without an
 * explicit cover. Signing the URLs is local (no I/O). Returns a map of
 * galleryId -> URL (or null).
 */
export async function getGalleryListCoverUrls(
  galleries: GalleryRecord[],
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const g of galleries) result[g.id] = g.cover_image_url ?? null;

  const needPhoto = galleries.filter((g) => !g.cover_image_url);
  if (!needPhoto.length || !hasR2Config()) return result;

  const supabase = await createSupabaseServerClient();
  const pickKey = (p: { web_key: string | null; thumbnail_key: string | null }) =>
    p.web_key ?? p.thumbnail_key ?? null;

  // 1) Chosen cover photos, batched by id.
  const coverPhotoIds = needPhoto
    .map((g) => g.cover_photo_id)
    .filter((id): id is string => Boolean(id));
  const keyByPhotoId = new Map<string, string>();
  if (coverPhotoIds.length) {
    const { data } = await supabase
      .from("photos")
      .select("id,web_key,thumbnail_key")
      .in("id", coverPhotoIds);
    for (const p of (data ?? []) as { id: string; web_key: string | null; thumbnail_key: string | null }[]) {
      const key = pickKey(p);
      if (key) keyByPhotoId.set(p.id, key);
    }
  }

  // 2) First visible photo per gallery, for those still without a cover.
  const needFirst = needPhoto.filter(
    (g) => !(g.cover_photo_id && keyByPhotoId.has(g.cover_photo_id)),
  );
  const keyByGalleryId = new Map<string, string>();
  if (needFirst.length) {
    const { data } = await supabase
      .from("photos")
      .select("gallery_id,web_key,thumbnail_key")
      .in("gallery_id", needFirst.map((g) => g.id))
      .eq("is_hidden", false)
      .order("gallery_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    for (const p of (data ?? []) as {
      gallery_id: string;
      web_key: string | null;
      thumbnail_key: string | null;
    }[]) {
      if (keyByGalleryId.has(p.gallery_id)) continue; // first row wins
      const key = pickKey(p);
      if (key) keyByGalleryId.set(p.gallery_id, key);
    }
  }

  await Promise.all(
    needPhoto.map(async (g) => {
      const key =
        (g.cover_photo_id && keyByPhotoId.get(g.cover_photo_id)) || keyByGalleryId.get(g.id);
      result[g.id] = key ? await getSignedReadUrl(key) : null;
    }),
  );

  return result;
}

export async function getAdminInquiries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id,name,email,phone,event_type,event_date,location,budget,referral_source,message,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InquiryRecord[];
}

export async function getGalleryLastInvite(galleryId: string): Promise<GalleryInviteLogEntry | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("gallery_invite_log")
    .select("id,gallery_id,sent_to,sent_at,resend_message_id")
    .eq("gallery_id", galleryId)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Non-fatal — page still renders without invite history
    console.warn("[gallery-invite-log] query failed:", error.message);
    return null;
  }

  return data as GalleryInviteLogEntry | null;
}

export async function getAdminDashboardCounts() {
  const supabase = await createSupabaseServerClient();
  const [galleries, published, drafts, archived, inquiries] = await Promise.all([
    supabase.from("galleries").select("id", { count: "exact", head: true }),
    supabase
      .from("galleries")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("is_archived", false),
    supabase
      .from("galleries")
      .select("id", { count: "exact", head: true })
      .eq("is_published", false)
      .eq("is_archived", false),
    supabase.from("galleries").select("id", { count: "exact", head: true }).eq("is_archived", true),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
  ]);

  return {
    galleries: galleries.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    archived: archived.count ?? 0,
    inquiries: inquiries.count ?? 0,
  };
}

