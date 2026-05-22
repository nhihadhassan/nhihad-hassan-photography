import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getSignedReadUrl } from "@/lib/r2";
import { hasR2Config } from "@/lib/env";

// ── Types ──────────────────────────────────────────────────────────────────

export type ShareLink = {
  id: string;
  gallery_id: string;
  token: string;
  title: string;
  recipient_label: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  photo_count: number;
};

export type ShareLinkPhoto = {
  id: string; // gallery_share_link_photos.id
  photo_id: string;
  sort_order: number;
  filename: string;
  display_url: string;
  thumbnail_url: string;
  width: number | null;
  height: number | null;
};

export type ShareLinkWithPhotos = {
  id: string;
  gallery_id: string;
  gallery_title: string;
  token: string;
  title: string;
  recipient_label: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  photos: ShareLinkPhoto[];
};

// ── Token generation ───────────────────────────────────────────────────────

/** 32-byte (256-bit) random hex token — unguessable at any feasible scale. */
export function generateShareToken(): string {
  return randomBytes(32).toString("hex");
}

// ── Write operations ───────────────────────────────────────────────────────

export async function createShareLink(input: {
  galleryId: string;
  title: string;
  recipientLabel?: string | null;
  expiresAt?: string | null;
  photoIds: string[];
}): Promise<{ id: string; token: string }> {
  const admin = getServiceRoleSupabaseClient();
  const token = generateShareToken();

  const { data: link, error: linkError } = await admin
    .from("gallery_share_links")
    .insert({
      gallery_id: input.galleryId,
      token,
      title: input.title || "Share link",
      recipient_label: input.recipientLabel ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select("id")
    .single();

  if (linkError || !link) {
    throw new Error(linkError?.message ?? "Failed to create share link.");
  }

  if (input.photoIds.length > 0) {
    const rows = input.photoIds.map((photoId, i) => ({
      share_link_id: link.id as string,
      photo_id: photoId,
      sort_order: i,
    }));

    const { error: photoError } = await admin
      .from("gallery_share_link_photos")
      .insert(rows);

    if (photoError) {
      // Roll back the link record to avoid orphans
      await admin.from("gallery_share_links").delete().eq("id", link.id);
      throw new Error(photoError.message);
    }
  }

  return { id: link.id as string, token };
}

export async function revokeShareLink(id: string): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("gallery_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ── Read operations ────────────────────────────────────────────────────────

export async function getGalleryShareLinks(galleryId: string): Promise<ShareLink[]> {
  const admin = getServiceRoleSupabaseClient();

  const { data, error } = await admin
    .from("gallery_share_links")
    .select("id,gallery_id,token,title,recipient_label,expires_at,revoked_at,created_at")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const links = (data ?? []) as Omit<ShareLink, "photo_count">[];

  const counts = await Promise.all(
    links.map(async (link) => {
      const { count } = await admin
        .from("gallery_share_link_photos")
        .select("id", { count: "exact", head: true })
        .eq("share_link_id", link.id);
      return count ?? 0;
    }),
  );

  return links.map((link, i) => ({ ...link, photo_count: counts[i] }));
}

type RawPhotoRow = {
  id: string;
  filename: string;
  web_key: string | null;
  thumbnail_key: string | null;
  original_key: string;
  width: number | null;
  height: number | null;
  is_hidden: boolean;
};

type RawLinkPhoto = {
  id: string;
  photo_id: string;
  sort_order: number;
};

/**
 * Fetches a share link by its opaque token. Returns null if:
 * - token not found
 * - link is revoked
 * - link is expired
 *
 * Photos with is_hidden=true are excluded even if pinned to the link.
 */
export async function getShareLinkByToken(
  token: string,
): Promise<ShareLinkWithPhotos | null> {
  const admin = getServiceRoleSupabaseClient();

  const { data: link, error: linkError } = await admin
    .from("gallery_share_links")
    .select("id,gallery_id,token,title,recipient_label,expires_at,revoked_at,created_at")
    .eq("token", token)
    .maybeSingle();

  if (linkError || !link) return null;

  const l = link as {
    id: string;
    gallery_id: string;
    token: string;
    title: string;
    recipient_label: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    created_at: string;
  };

  // Access checks
  if (l.revoked_at) return null;
  if (l.expires_at && new Date(l.expires_at) <= new Date()) return null;

  // Gallery title
  const { data: gallery } = await admin
    .from("galleries")
    .select("title")
    .eq("id", l.gallery_id)
    .maybeSingle();

  // Pinned photo join rows
  const { data: linkPhotos, error: photoLinkError } = await admin
    .from("gallery_share_link_photos")
    .select("id,photo_id,sort_order")
    .eq("share_link_id", l.id)
    .order("sort_order", { ascending: true });

  if (photoLinkError) return null;

  const rawLinkPhotos = (linkPhotos ?? []) as RawLinkPhoto[];
  const photoIds = rawLinkPhotos.map((p) => p.photo_id);

  let photos: ShareLinkPhoto[] = [];

  if (photoIds.length > 0) {
    const { data: photoRows } = await admin
      .from("photos")
      .select("id,filename,web_key,thumbnail_key,original_key,width,height,is_hidden")
      .in("id", photoIds)
      .eq("is_hidden", false);

    const validPhotos = (photoRows ?? []) as RawPhotoRow[];

    if (hasR2Config()) {
      photos = await Promise.all(
        validPhotos.map(async (p) => {
          const displayKey = p.web_key ?? p.original_key;
          const thumbKey = p.thumbnail_key ?? displayKey;
          const [displayUrl, thumbUrl] = await Promise.all([
            getSignedReadUrl(displayKey),
            thumbKey === displayKey ? Promise.resolve("") : getSignedReadUrl(thumbKey),
          ]);

          const linkPhoto = rawLinkPhotos.find((lp) => lp.photo_id === p.id);

          return {
            id: linkPhoto?.id ?? p.id,
            photo_id: p.id,
            sort_order: linkPhoto?.sort_order ?? 0,
            filename: p.filename,
            display_url: displayUrl,
            thumbnail_url: thumbUrl || displayUrl,
            width: p.width,
            height: p.height,
          };
        }),
      );

      photos.sort((a, b) => a.sort_order - b.sort_order);
    }
  }

  return {
    id: l.id,
    gallery_id: l.gallery_id,
    gallery_title: (gallery as { title: string } | null)?.title ?? "Gallery",
    token: l.token,
    title: l.title,
    recipient_label: l.recipient_label,
    expires_at: l.expires_at,
    revoked_at: l.revoked_at,
    created_at: l.created_at,
    photos,
  };
}
