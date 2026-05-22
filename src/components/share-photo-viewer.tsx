"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import type { ShareLinkPhoto } from "@/lib/share-links";

// ── Lightbox ───────────────────────────────────────────────────────────────

type LightboxProps = {
  photos: ShareLinkPhoto[];
  open: boolean;
  initialIndex: number;
  onClose: () => void;
};

function ShareLightbox({ photos, open, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [trackedInitial, setTrackedInitial] = useState(initialIndex);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // Sync index when parent changes which photo to open.
  if (trackedInitial !== initialIndex) {
    setTrackedInitial(initialIndex);
    setIndex(initialIndex);
    setLoading(true);
  }

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      lastFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const prev = useCallback(() => {
    setLoading(true);
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setLoading(true);
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, prev, next]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {/* Counter */}
          <p className="absolute left-4 top-4 text-sm text-white/50">
            {index + 1} / {photos.length}
          </p>

          {/* Prev */}
          {photos.length > 1 ? (
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              <ChevronLeft className="size-6" />
            </button>
          ) : null}

          {/* Image */}
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-white/40" />
              </div>
            ) : null}
            <Image
              key={photo.photo_id}
              src={photo.display_url}
              alt={photo.filename}
              width={photo.width ?? 1600}
              height={photo.height ?? 1067}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onLoad={() => setLoading(false)}
              unoptimized
              priority
            />
          </div>

          {/* Next */}
          {photos.length > 1 ? (
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              <ChevronRight className="size-6" />
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ── Grid ───────────────────────────────────────────────────────────────────

type SharePhotoViewerProps = {
  photos: ShareLinkPhoto[];
};

export function SharePhotoViewer({ photos }: SharePhotoViewerProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-white/40">
        No photos in this share link.
      </p>
    );
  }

  return (
    <>
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => {
          const w = photo.width ?? 1200;
          const h = photo.height ?? 800;
          return (
            <article key={photo.id} className="mb-3 break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpenAt(index)}
                aria-label={`Open photo ${index + 1}`}
                className="relative block w-full cursor-zoom-in overflow-hidden rounded-sm bg-white/8 focus-visible:outline-2 focus-visible:outline-white/40"
              >
                <Image
                  src={photo.thumbnail_url || photo.display_url}
                  alt={photo.filename}
                  width={w}
                  height={h}
                  className="w-full object-cover transition duration-500 hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              </button>
            </article>
          );
        })}
      </div>

      <ShareLightbox
        photos={photos}
        open={openAt !== null}
        initialIndex={openAt ?? 0}
        onClose={() => setOpenAt(null)}
      />
    </>
  );
}
