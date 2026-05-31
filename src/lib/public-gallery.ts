import "server-only";
import {
  hasSupabaseBrowserConfig,
  hasR2Config,
  hasServiceRoleKey,
} from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getSignedReadUrl } from "@/lib/r2";
import {
  getPublicGalleryPhotosBySlug,
  type PhotoRecord,
  type PhotoWithUrls,
} from "@/lib/photos";
import { hasGalleryAccess } from "@/lib/gallery-access";
import { getMockGallery, portfolioItems, type PortfolioItem } from "@/data/photography";

export type PublicGalleryPhoto = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
  orientation: "portrait" | "landscape" | "square";
};

export type PublicGallery = {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  date: string | null;
  description: string | null;
  location: string | null;
  imageUrl: string;
  alt: string;
  coverFocalX: number;
  coverFocalY: number;
  coverLayout: "center" | "left" | "bottom" | "split";
  isPublic: boolean;
  downloadEnabled: boolean;
  downloadQuality: "web" | "full";
  protected: boolean;
  sections: string[];
  photos: PublicGalleryPhoto[];
  hasRealPhotos: boolean;
  hasPassword: boolean;
  isUnlocked: boolean;
};

const fallbackCover = portfolioItems[0];
const PHOTO_COLUMNS =
  "id,gallery_id,section_id,original_key,web_key,thumbnail_key,filename,width,height,size_bytes,mime_type,blur_data_url,sort_order,is_hidden,created_at";

function orientationFromDims(
  width: number | null,
  height: number | null,
): PublicGalleryPhoto["orientation"] {
  if (!width || !height) return "landscape";
  const ratio = width / height;
  if (ratio > 1.1) return "landscape";
  if (ratio < 0.9) return "portrait";
  return "square";
}

function mockToPublicPhoto(item: PortfolioItem): PublicGalleryPhoto {
  return {
    id: item.id,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.imageUrl,
    alt: item.alt,
    width: null,
    height: null,
    orientation: item.orientation,
  };
}

function realToPublicPhoto(photo: PhotoWithUrls): PublicGalleryPhoto {
  return {
    id: photo.id,
    imageUrl: photo.display_url,
    thumbnailUrl: photo.thumbnail_url || photo.display_url,
    alt: photo.filename,
    width: photo.width,
    height: photo.height,
    orientation: orientationFromDims(photo.width, photo.height),
  };
}

async function attachSignedUrlsLocal(photos: PhotoRecord[]): Promise<PhotoWithUrls[]> {
  if (!photos.length || !hasR2Config()) {
    return photos.map((p) => ({ ...p, display_url: "", thumbnail_url: "" }));
  }
  return Promise.all(
    photos.map(async (photo) => {
      const displayKey = photo.web_key ?? photo.original_key;
      const thumbKey = photo.thumbnail_key ?? photo.web_key ?? photo.original_key;
      const [display_url, thumbnail_url] = await Promise.all([
        getSignedReadUrl(displayKey),
        thumbKey === displayKey ? Promise.resolve("") : getSignedReadUrl(thumbKey),
      ]);
      return {
        ...photo,
        display_url,
        thumbnail_url: thumbnail_url || display_url,
      };
    }),
  );
}

/**
 * Reads photos for a password-protected gallery using the service-role client.
 * The caller MUST verify the access cookie before invoking this.
 */
async function getProtectedGalleryPhotos(galleryId: string): Promise<PhotoWithUrls[]> {
  if (!hasServiceRoleKey()) return [];
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("gallery_id", galleryId)
    .eq("is_hidden", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return attachSignedUrlsLocal((data ?? []) as PhotoRecord[]);
}

async function getProtectedCoverPhoto(coverPhotoId: string) {
  if (!hasServiceRoleKey() || !hasR2Config()) return null;
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("id", coverPhotoId)
    .maybeSingle();
  if (!data) return null;
  const photo = data as PhotoRecord;
  const displayKey = photo.web_key ?? photo.original_key;
  return {
    url: await getSignedReadUrl(displayKey),
    alt: photo.filename,
  };
}

export async function getPublishedGalleryBySlug(slug: string): Promise<PublicGallery | null> {
  if (!hasSupabaseBrowserConfig()) {
    const mock = getMockGallery(slug);
    return mock
      ? {
          id: mock.slug,
          title: mock.title,
          slug: mock.slug,
          clientName: mock.clientName,
          date: mock.date,
          description: mock.description,
          location: mock.location,
          imageUrl: mock.imageUrl,
          alt: mock.alt,
          coverFocalX: 50,
          coverFocalY: 50,
          coverLayout: "center",
          isPublic: true,
          downloadEnabled: false,
          downloadQuality: "web",
          protected: mock.protected,
          sections: mock.sections,
          photos: mock.photos.map(mockToPublicPhoto),
          hasRealPhotos: false,
          hasPassword: false,
          isUnlocked: true,
        }
      : null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_gallery_by_slug", {
    requested_slug: slug,
  });

  if (error || !data?.length) {
    return null;
  }

  const gallery = data[0] as {
    id: string;
    title: string;
    slug: string;
    client_name: string | null;
    event_date: string | null;
    description: string | null;
    location: string | null;
    cover_image_url: string | null;
    cover_image_alt: string | null;
    cover_photo_id: string | null;
    cover_focal_x: number | null;
    cover_focal_y: number | null;
    cover_layout: string | null;
    is_public: boolean;
    download_enabled: boolean;
    download_quality: "web" | "full";
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    has_password: boolean | null;
  };

  const mock = getMockGallery(slug);
  const hasPassword = Boolean(gallery.has_password);
  const isUnlocked = hasPassword ? await hasGalleryAccess(gallery.id) : true;

  // Photos: public RPC for unprotected galleries, service-role for protected+unlocked.
  let realPhotos: PhotoWithUrls[] = [];
  if (hasR2Config()) {
    if (!hasPassword) {
      realPhotos = await getPublicGalleryPhotosBySlug(slug);
    } else if (isUnlocked) {
      realPhotos = await getProtectedGalleryPhotos(gallery.id);
    }
    // else: protected + locked → photos stay []
  }

  let coverUrl: string = gallery.cover_image_url || mock?.imageUrl || fallbackCover.imageUrl;
  // Human-friendly alt only — never the raw uploaded filename.
  const coverAlt: string =
    gallery.cover_image_alt || mock?.alt || `${gallery.title} gallery cover`;

  if (hasR2Config()) {
    // cover_photo_id is returned by the safe public RPC so the browser-facing
    // app never needs a broad direct SELECT policy on galleries.
    const coverPhotoId = gallery.cover_photo_id;
    if (coverPhotoId) {
      if (hasPassword) {
        const cover = await getProtectedCoverPhoto(coverPhotoId);
        if (cover) {
          coverUrl = cover.url;
        }
      } else {
        const coverPhoto = realPhotos.find((p) => p.id === coverPhotoId);
        if (coverPhoto?.display_url) {
          coverUrl = coverPhoto.display_url;
        }
      }
    } else if (!hasPassword && realPhotos.length && !gallery.cover_image_url) {
      coverUrl = realPhotos[0].display_url || coverUrl;
    }
  }

  const photos: PublicGalleryPhoto[] = realPhotos.map(realToPublicPhoto);

  return {
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    clientName: gallery.client_name,
    date: gallery.event_date,
    description: gallery.description,
    location: gallery.location,
    imageUrl: coverUrl,
    alt: coverAlt,
    coverFocalX: gallery.cover_focal_x ?? 50,
    coverFocalY: gallery.cover_focal_y ?? 50,
    coverLayout: (["center", "left", "bottom", "split"].includes(gallery.cover_layout ?? "")
      ? gallery.cover_layout
      : "center") as PublicGallery["coverLayout"],
    isPublic: gallery.is_public,
    downloadEnabled: gallery.download_enabled,
    downloadQuality: gallery.download_quality,
    protected: hasPassword || !gallery.is_public,
    sections: mock?.sections ?? ["Highlights", "All Photos"],
    photos,
    hasRealPhotos: realPhotos.length > 0,
    hasPassword,
    isUnlocked,
  };
}

export type PublicGalleryCard = {
  slug: string;
  title: string;
  date: string | null;
  location: string | null;
  imageUrl: string;
  alt: string;
  hasPassword: boolean;
};

/**
 * Lists galleries that are flagged for the public index (is_public + published,
 * not archived, not expired). Private "link-only" galleries are intentionally
 * excluded. Cover images are resolved to signed R2 thumbnails when available.
 */
export async function getPublicGalleryIndex(): Promise<PublicGalleryCard[]> {
  // Without Supabase configured, fall back to the mock featured gallery so the
  // page still renders something in local/preview environments.
  if (!hasSupabaseBrowserConfig() || !hasServiceRoleKey()) {
    const mock = getMockGallery("moove-ah");
    return mock
      ? [
          {
            slug: mock.slug,
            title: mock.title,
            date: mock.date,
            location: mock.location,
            imageUrl: mock.imageUrl,
            alt: mock.alt,
            hasPassword: false,
          },
        ]
      : [];
  }

  const supabase = getServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("galleries")
    .select(
      "id,title,slug,event_date,location,cover_image_url,cover_image_alt,cover_photo_id,expires_at,password_hash",
    )
    .eq("is_public", true)
    .eq("is_published", true)
    .eq("is_archived", false)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const now = Date.now();
  const live = data.filter(
    (g) => !g.expires_at || new Date(g.expires_at as string).getTime() > now,
  );

  return Promise.all(
    live.map(async (g) => {
      let imageUrl = (g.cover_image_url as string | null) || fallbackCover.imageUrl;
      // Human-friendly alt: the admin-set cover alt, else the gallery title.
      // Never the raw filename (e.g. "Oishi and Lucky # (9).jpeg").
      const alt = (g.cover_image_alt as string | null) || `${g.title as string} gallery cover`;

      if (hasR2Config()) {
        let key: string | null = null;
        if (g.cover_photo_id) {
          const { data: photo } = await supabase
            .from("photos")
            .select("thumbnail_key,web_key")
            .eq("id", g.cover_photo_id as string)
            .maybeSingle();
          key =
            (photo?.thumbnail_key as string | null) ??
            (photo?.web_key as string | null) ??
            null;
        }
        // No explicit cover set: use the first visible photo as the cover.
        if (!key && !g.cover_image_url) {
          const { data: first } = await supabase
            .from("photos")
            .select("thumbnail_key,web_key")
            .eq("gallery_id", g.id as string)
            .eq("is_hidden", false)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          key =
            (first?.thumbnail_key as string | null) ??
            (first?.web_key as string | null) ??
            null;
        }
        if (key) {
          const signed = await getSignedReadUrl(key);
          if (signed) imageUrl = signed;
        }
      }

      return {
        slug: g.slug as string,
        title: g.title as string,
        date: (g.event_date as string | null) ?? null,
        location: (g.location as string | null) ?? null,
        imageUrl,
        alt,
        hasPassword: Boolean(g.password_hash),
      };
    }),
  );
}

export async function getSignedCoverUrlForKey(key: string) {
  if (!hasR2Config()) return null;
  return getSignedReadUrl(key);
}
