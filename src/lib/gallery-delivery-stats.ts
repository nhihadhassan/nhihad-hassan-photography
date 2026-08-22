import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GalleryDeliveryStats = {
  /** Successful opens, all time. */
  views: number;
  /** Failed attempts -- usually a wrong password. */
  failedAttempts: number;
  lastOpenedAt: string | null;
  /** Successful full-gallery or selection downloads, all time. */
  downloads: number;
  lastDownloadedAt: string | null;
  /** Favourite sets the client has put together. */
  selectSets: number;
  /** Sets the client has actually submitted to you. */
  submittedSelectSets: number;
};

const EMPTY: GalleryDeliveryStats = {
  views: 0,
  failedAttempts: 0,
  lastOpenedAt: null,
  downloads: 0,
  lastDownloadedAt: null,
  selectSets: 0,
  submittedSelectSets: 0,
};

/**
 * All-time engagement for one gallery: has the client opened it, downloaded
 * anything, picked any favourites.
 *
 * These questions previously required leaving the gallery for the raw Access
 * Logs and Download Logs screens, filtering by gallery, and reading rows. The
 * detailed logs still exist under Settings for when the rows themselves matter
 * -- this is the summary that answers "did it land?".
 *
 * Counts are head-only queries, so this reads totals without pulling log rows.
 * Failures here are non-fatal: a stats panel must never take the Share page
 * down with it.
 */
export async function getGalleryDeliveryStats(
  galleryId: string,
): Promise<GalleryDeliveryStats> {
  try {
    const supabase = await createSupabaseServerClient();

    const [views, failures, lastOpen, downloads, lastDownload, selects] = await Promise.all([
      supabase
        .from("gallery_access_logs")
        .select("id", { count: "exact", head: true })
        .eq("gallery_id", galleryId)
        .eq("success", true),
      supabase
        .from("gallery_access_logs")
        .select("id", { count: "exact", head: true })
        .eq("gallery_id", galleryId)
        .eq("success", false),
      supabase
        .from("gallery_access_logs")
        .select("accessed_at")
        .eq("gallery_id", galleryId)
        .eq("success", true)
        .order("accessed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("gallery_download_logs")
        .select("id", { count: "exact", head: true })
        .eq("gallery_id", galleryId)
        .eq("success", true),
      supabase
        .from("gallery_download_logs")
        .select("accessed_at")
        .eq("gallery_id", galleryId)
        .eq("success", true)
        .order("accessed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("favorite_sets")
        .select("id,submitted_at")
        .eq("gallery_id", galleryId),
    ]);

    const selectRows = (selects.data ?? []) as { submitted_at: string | null }[];

    return {
      views: views.count ?? 0,
      failedAttempts: failures.count ?? 0,
      lastOpenedAt: (lastOpen.data as { accessed_at?: string } | null)?.accessed_at ?? null,
      downloads: downloads.count ?? 0,
      lastDownloadedAt:
        (lastDownload.data as { accessed_at?: string } | null)?.accessed_at ?? null,
      selectSets: selectRows.length,
      submittedSelectSets: selectRows.filter((row) => row.submitted_at).length,
    };
  } catch {
    return EMPTY;
  }
}
