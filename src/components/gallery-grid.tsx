"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Download, Film, Maximize2, Play } from "lucide-react";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { SelectToggle } from "@/components/select-toggle";
import { useSelects } from "@/components/selects-provider";
import { START_SLIDESHOW_EVENT } from "@/components/slideshow-button";
import type { PublicGalleryPhoto } from "@/lib/public-gallery";

type GalleryGridProps = {
  photos: PublicGalleryPhoto[];
  unoptimizedImages?: boolean;
  enableSelects?: boolean;
  enableDownload?: boolean;
  slug?: string;
};

function formatDuration(seconds: number | null): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useColumnCount() {
  // Starts at the server-rendered 3 and corrects on mount, so narrow viewports
  // don't hydrate against a different column count.
  const [count, setCount] = useState(3);
  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setCount(3);
      else if (window.matchMedia("(min-width: 640px)").matches) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

function markLoaded(id: string, setLoadedIds: Dispatch<SetStateAction<Set<string>>>) {
  setLoadedIds((prev) => {
    if (prev.has(id)) return prev;
    const next = new Set(prev);
    next.add(id);
    return next;
  });
}

/** Poster/photo image for one tile. A video with no extracted poster frame
 * falls back to a generic card rather than rendering its own video URL as an
 * <img> src, which would just be a broken image. */
function MediaThumb({
  photo,
  width,
  height,
  loaded,
  unoptimizedImages,
  priority,
  onLoad,
}: {
  photo: PublicGalleryPhoto;
  width: number;
  height: number;
  loaded: boolean;
  unoptimizedImages: boolean;
  priority: boolean;
  onLoad: () => void;
}) {
  if (photo.mediaType === "video" && !photo.hasPoster) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink/15 text-soft-white/50">
        <Film className="size-8" aria-hidden="true" />
      </div>
    );
  }
  return (
    <Image
      src={photo.thumbnailUrl}
      alt={photo.alt}
      width={width}
      height={height}
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className={cn(
        "h-auto w-full object-cover transition duration-700 group-hover:scale-[1.02]",
        loaded ? "opacity-100" : "opacity-0",
      )}
      onLoad={onLoad}
      priority={priority}
      unoptimized={unoptimizedImages}
    />
  );
}

/** Play affordance + duration pill shown over a video tile. */
function VideoBadges({ isVideo, duration }: { isVideo: boolean; duration: string | null }) {
  if (!isVideo) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-ink/55 text-soft-white backdrop-blur transition group-hover:bg-ink/70">
          <Play className="size-4 translate-x-[1px]" aria-hidden="true" fill="currentColor" />
        </span>
      </span>
      {duration ? (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-soft-white">
          {duration}
        </span>
      ) : null}
    </>
  );
}

export function GalleryGrid({
  photos,
  unoptimizedImages = false,
  enableSelects = false,
  enableDownload = false,
  slug,
}: GalleryGridProps) {
  const [openAt, setOpenAt] = useState<number | null>(() => {
    if (typeof window === "undefined" || photos.length === 0) return null;
    const pid = new URLSearchParams(window.location.search).get("p");
    if (!pid) return null;
    const index = photos.findIndex((photo) => photo.id === pid);
    return index >= 0 ? index : null;
  });
  const [slideshow, setSlideshow] = useState(false);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const { isSelected } = useSelects();
  const columnCount = useColumnCount();

  // Photos are dealt across the columns round-robin so reading order runs
  // left-to-right (1 2 3 / 4 5 6). CSS multi-column would instead fill each
  // column top-to-bottom, which reorders the gallery the admin arranged.
  const columns = useMemo(() => {
    const buckets: { photo: PublicGalleryPhoto; index: number }[][] = Array.from(
      { length: columnCount },
      () => [],
    );
    photos.forEach((photo, index) => {
      buckets[index % columnCount].push({ photo, index });
    });
    return buckets;
  }, [photos, columnCount]);

  useEffect(() => {
    const start = () => {
      if (photos.length === 0) return;
      setSlideshow(true);
      setOpenAt(0);
    };
    window.addEventListener(START_SLIDESHOW_EVENT, start);
    return () => window.removeEventListener(START_SLIDESHOW_EVENT, start);
  }, [photos.length]);

  return (
    <>
      <div className="mt-10 flex gap-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-4">
        {column.map(({ photo, index }) => {
          const width = photo.width ?? (photo.orientation === "portrait" ? 900 : 1400);
          const height =
            photo.height ?? (photo.orientation === "portrait" ? 1125 : 950);
          // Selects are a proofing step (client picks frames to edit), which
          // doesn't map onto a video that's delivered as-is, so the toggle
          // never renders for one.
          const selected = enableSelects && photo.mediaType === "image" && isSelected(photo.id);
          const loaded = loadedIds.has(photo.id) || photo.mediaType === "video";
          const isVideo = photo.mediaType === "video";
          const duration = formatDuration(photo.durationSeconds);

          // A .mov never attempts inline playback (see previewable on
          // PublicGalleryPhoto), so its tile downloads directly instead of
          // opening a lightbox with nothing to show.
          if (isVideo && !photo.previewable) {
            if (!enableDownload || !slug) {
              return (
                <article key={photo.id} className="group relative">
                  <div
                    title="This video isn't available to preview or download for this gallery."
                    className="relative block w-full cursor-not-allowed overflow-hidden rounded-[2px] bg-ink/8 opacity-70"
                  >
                    <MediaThumb photo={photo} width={width} height={height} loaded={loaded} unoptimizedImages={unoptimizedImages} priority={index < 2} onLoad={() => markLoaded(photo.id, setLoadedIds)} />
                    <VideoBadges isVideo duration={duration} />
                  </div>
                </article>
              );
            }
            return (
              <article key={photo.id} className="group relative">
                <form
                  action={`/api/galleries/${encodeURIComponent(slug)}/download`}
                  method="POST"
                  className="block"
                >
                  <input type="hidden" name="scope" value="single" />
                  <input type="hidden" name="photo_ids" value={photo.id} />
                  <button
                    type="submit"
                    aria-label={`Download video ${index + 1} of ${photos.length}: ${photo.alt}`}
                    className="relative block w-full cursor-pointer overflow-hidden rounded-[2px] bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
                  >
                    <MediaThumb photo={photo} width={width} height={height} loaded={loaded} unoptimizedImages={unoptimizedImages} priority={index < 2} onLoad={() => markLoaded(photo.id, setLoadedIds)} />
                    <VideoBadges isVideo duration={duration} />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full bg-[#f3eee5]/88 px-3 py-1.5 text-xs font-medium text-ink opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100"
                    >
                      <Download className="size-3.5" /> Download to view
                    </span>
                  </button>
                </form>
              </article>
            );
          }

          return (
            <article key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => setOpenAt(index)}
                aria-label={`Open ${isVideo ? "video" : "photo"} ${index + 1} of ${photos.length}: ${photo.alt}`}
                className={
                  "relative block w-full cursor-zoom-in overflow-hidden rounded-[2px] bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper " +
                  (selected ? "ring-2 ring-copper ring-offset-2 ring-offset-[#f3eee5] " : "") +
                  (!loaded ? "animate-pulse" : "")
                }
              >
                <MediaThumb photo={photo} width={width} height={height} loaded={loaded} unoptimizedImages={unoptimizedImages} priority={index < 2} onLoad={() => markLoaded(photo.id, setLoadedIds)} />
                {isVideo ? (
                  <VideoBadges isVideo duration={duration} />
                ) : (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-3 hidden size-9 items-center justify-center rounded-full bg-[#f3eee5]/88 text-ink opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 sm:flex"
                  >
                    <Maximize2 className="size-4" />
                  </span>
                )}
              </button>
              {enableSelects && !isVideo ? (
                <div className="absolute right-3 top-3 z-10">
                  <SelectToggle photoId={photo.id} variant="grid" />
                </div>
              ) : null}
            </article>
          );
        })}
          </div>
        ))}
      </div>
      <GalleryLightbox
        photos={photos}
        open={openAt !== null}
        initialIndex={openAt ?? 0}
        onClose={() => {
          setOpenAt(null);
          setSlideshow(false);
        }}
        unoptimizedImages={unoptimizedImages}
        enableSelects={enableSelects}
        enableDownload={enableDownload}
        slug={slug}
        autoPlay={slideshow}
      />
    </>
  );
}
