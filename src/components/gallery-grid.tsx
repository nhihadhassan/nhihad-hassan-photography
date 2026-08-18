"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
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
          const selected = enableSelects && isSelected(photo.id);
          const loaded = loadedIds.has(photo.id);
          return (
            <article key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => setOpenAt(index)}
                aria-label={`Open photo ${index + 1} of ${photos.length}: ${photo.alt}`}
                className={
                  "relative block w-full cursor-zoom-in overflow-hidden rounded-[2px] bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper " +
                  (selected ? "ring-2 ring-copper ring-offset-2 ring-offset-[#f3eee5] " : "") +
                  (!loaded ? "animate-pulse" : "")
                }
              >
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
                  onLoad={() =>
                    setLoadedIds((prev) => {
                      if (prev.has(photo.id)) return prev;
                      const next = new Set(prev);
                      next.add(photo.id);
                      return next;
                    })
                  }
                  priority={index < 2}
                  unoptimized={unoptimizedImages}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3 hidden size-9 items-center justify-center rounded-full bg-[#f3eee5]/88 text-ink opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 sm:flex"
                >
                  <Maximize2 className="size-4" />
                </span>
              </button>
              {enableSelects ? (
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
