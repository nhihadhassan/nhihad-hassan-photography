"use client";

import { useEffect, useState } from "react";
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
};

export function GalleryGrid({
  photos,
  unoptimizedImages = false,
  enableSelects = false,
}: GalleryGridProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const { isSelected } = useSelects();

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
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => {
          const width = photo.width ?? (photo.orientation === "portrait" ? 900 : 1400);
          const height =
            photo.height ?? (photo.orientation === "portrait" ? 1125 : 950);
          const selected = enableSelects && isSelected(photo.id);
          return (
            <article key={photo.id} className="group relative mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpenAt(index)}
                aria-label={`Open photo ${index + 1} of ${photos.length}: ${photo.alt}`}
                className={
                  "relative block w-full cursor-zoom-in overflow-hidden rounded-[2px] bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper " +
                  (selected ? "ring-2 ring-copper ring-offset-2 ring-offset-[#f3eee5]" : "")
                }
              >
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.alt}
                  width={width}
                  height={height}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full object-cover transition duration-700 group-hover:scale-[1.02]"
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
        autoPlay={slideshow}
      />
    </>
  );
}
