"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import type { PublicGalleryPhoto } from "@/lib/public-gallery";
import { SelectToggle } from "@/components/select-toggle";

type GalleryLightboxProps = {
  photos: PublicGalleryPhoto[];
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  unoptimizedImages?: boolean;
  enableSelects?: boolean;
};

const SWIPE_OFFSET = 60;
const SWIPE_VELOCITY = 280;

export function GalleryLightbox({
  photos,
  open,
  initialIndex,
  onClose,
  unoptimizedImages = true,
  enableSelects = false,
}: GalleryLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [trackedInitial, setTrackedInitial] = useState(initialIndex);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  if (trackedInitial !== initialIndex) {
    setTrackedInitial(initialIndex);
    setIndex(initialIndex);
    setLoading(true);
  }

  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      try {
        lastFocusRef.current?.focus?.();
      } catch {
        // ignore
      }
    };
  }, [open]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setLoading(true);
    setIndex(index - 1);
  }, [index]);

  const goNext = useCallback(() => {
    if (index >= photos.length - 1) return;
    setLoading(true);
    setIndex(index + 1);
  }, [index, photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) {
        goPrev();
      } else if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) {
        goNext();
      }
    },
    [goPrev, goNext],
  );

  const photo = photos[index];
  const total = photos.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;
  const transitionDuration = reduceMotion ? 0 : 0.18;

  return (
    <AnimatePresence>
      {open && photo ? (
        <motion.div
          key="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index + 1} of ${total}`}
          className="fixed inset-0 z-[100] flex flex-col bg-ink/97 text-soft-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: transitionDuration }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
            <span className="pointer-events-auto rounded-full border border-soft-white/12 bg-ink/55 px-3 py-1.5 font-mono text-[11px] tracking-[0.22em] text-soft-white/80 backdrop-blur">
              {String(index + 1).padStart(2, "0")} <span className="opacity-40">/</span> {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lightbox"
              className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition hover:border-soft-white/30 hover:bg-soft-white hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {hasPrev ? (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition hover:border-soft-white/30 hover:bg-soft-white hover:text-ink sm:flex"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
          ) : null}
          {hasNext ? (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition hover:border-soft-white/30 hover:bg-soft-white hover:text-ink sm:flex"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          ) : null}

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={photo.id}
                className="relative h-full w-full max-h-[100%] max-w-[100%]"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: transitionDuration }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={handleDragEnd}
              >
                <Image
                  src={photo.imageUrl}
                  alt={photo.alt}
                  fill
                  sizes="100vw"
                  className="select-none object-contain"
                  draggable={false}
                  priority
                  unoptimized={unoptimizedImages}
                  onLoad={() => setLoading(false)}
                />
              </motion.div>
            </AnimatePresence>
            {loading ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <Loader2 className="size-7 animate-spin text-soft-white/55" aria-hidden="true" />
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none flex items-end justify-between gap-4 p-4 sm:p-6">
            <div className="pointer-events-auto flex flex-col gap-3">
              {enableSelects ? <SelectToggle photoId={photo.id} variant="lightbox" /> : null}
              <span
                className="hidden truncate text-xs text-soft-white/45 sm:block"
                title={photo.alt}
              >
                {photo.alt}
              </span>
            </div>
            <div className="pointer-events-auto ml-auto flex gap-2 sm:hidden">
              <button
                type="button"
                onClick={goPrev}
                disabled={!hasPrev}
                aria-label="Previous photo"
                className="flex size-11 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition disabled:opacity-25"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!hasNext}
                aria-label="Next photo"
                className="flex size-11 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition disabled:opacity-25"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
