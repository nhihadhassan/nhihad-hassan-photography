"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Film, Loader2, Pause, Play, X } from "lucide-react";
import type { PublicGalleryPhoto } from "@/lib/public-gallery";
import { SelectToggle } from "@/components/select-toggle";
import { PhotoDownloadButton } from "@/components/photo-download-button";
import { PhotoShareButton } from "@/components/photo-share-button";

type GalleryLightboxProps = {
  photos: PublicGalleryPhoto[];
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  unoptimizedImages?: boolean;
  enableSelects?: boolean;
  enableDownload?: boolean;
  slug?: string;
  autoPlay?: boolean;
};

const SWIPE_OFFSET = 60;
const SWIPE_VELOCITY = 280;
const SLIDE_INTERVAL = 4000;

export function GalleryLightbox({
  photos,
  open,
  initialIndex,
  onClose,
  unoptimizedImages = true,
  enableSelects = false,
  enableDownload = false,
  slug,
  autoPlay = false,
}: GalleryLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  // A non-previewable video never fires a load event, so an initial index
  // that opens directly on one (e.g. a ?p= deep link) must not start "loading".
  const [loading, setLoading] = useState(() => {
    const initial = photos[initialIndex];
    return !(initial && initial.mediaType === "video" && !initial.previewable);
  });
  const [trackedInitial, setTrackedInitial] = useState(initialIndex);
  const [playOverride, setPlayOverride] = useState<boolean | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const playing = open ? (playOverride ?? autoPlay) : false;
  const close = useCallback(() => {
    setPlayOverride(null);
    onClose();
  }, [onClose]);

  // A non-previewable video (.mov) never fires onLoadedData — there's no
  // media element attempting to load anything for it — so every navigation
  // sets `loading` based on what the target slide actually needs, rather
  // than always flipping it true and hoping something clears it.
  const loadingForIndex = useCallback(
    (i: number) => {
      const target = photos[i];
      return !(target && target.mediaType === "video" && !target.previewable);
    },
    [photos],
  );

  // Auto-advance while playing, looping back to the first photo at the end.
  // Paused on a video slide — a visitor watching a clip shouldn't get cut
  // off after 4 seconds; they advance manually instead.
  const currentMediaType = photos[index]?.mediaType;
  useEffect(() => {
    if (!open || !playing || photos.length <= 1 || currentMediaType === "video") return;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % photos.length;
        setLoading(loadingForIndex(next));
        return next;
      });
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [open, playing, photos.length, currentMediaType, loadingForIndex]);

  if (trackedInitial !== initialIndex) {
    setTrackedInitial(initialIndex);
    setIndex(initialIndex);
    setLoading(loadingForIndex(initialIndex));
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
    setLoading(loadingForIndex(index - 1));
    setIndex(index - 1);
  }, [index, loadingForIndex]);

  const goNext = useCallback(() => {
    if (index >= photos.length - 1) return;
    setLoading(loadingForIndex(index + 1));
    setIndex(index + 1);
  }, [index, photos.length, loadingForIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
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
  }, [open, close, goPrev, goNext]);

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
          aria-label={`${photo?.mediaType === "video" ? "Video" : "Photo"} ${index + 1} of ${total}`}
          className="fixed inset-0 z-[100] flex flex-col bg-ink/97 text-soft-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: transitionDuration }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="pointer-events-auto rounded-full border border-soft-white/12 bg-ink/55 px-3 py-1.5 font-mono text-[11px] tracking-[0.22em] text-soft-white/80 backdrop-blur">
                {String(index + 1).padStart(2, "0")} <span className="opacity-40">/</span> {String(total).padStart(2, "0")}
              </span>
              {total > 1 ? (
                <button
                  type="button"
                  onClick={() => setPlayOverride((value) => !(value ?? autoPlay))}
                  aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                  className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition hover:border-soft-white/30 hover:bg-soft-white hover:text-ink"
                >
                  {playing ? (
                    <Pause className="size-5" aria-hidden="true" />
                  ) : (
                    <Play className="size-5" aria-hidden="true" />
                  )}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={close}
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
                {photo.mediaType === "video" ? (
                  photo.previewable ? (
                    <video
                      key={photo.id}
                      src={photo.imageUrl}
                      poster={photo.hasPoster ? photo.thumbnailUrl : undefined}
                      controls
                      playsInline
                      className="size-full object-contain"
                      onLoadedData={() => setLoading(false)}
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-4 px-6 text-center">
                      <Film className="size-10 text-soft-white/50" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-soft-white">
                          This video can&apos;t preview in the browser.
                        </p>
                        <p className="mt-1 text-xs text-soft-white/60">Download it to view.</p>
                      </div>
                      {enableDownload && slug ? (
                        <form
                          action={`/api/galleries/${encodeURIComponent(slug)}/download`}
                          method="POST"
                          onSubmit={() => setLoading(false)}
                        >
                          <input type="hidden" name="scope" value="single" />
                          <input type="hidden" name="photo_ids" value={photo.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full border border-soft-white/20 bg-ink/55 px-4 py-2 text-sm text-soft-white backdrop-blur transition hover:border-soft-white/40 hover:bg-soft-white hover:text-ink"
                          >
                            <Download className="size-4" aria-hidden="true" />
                            Download video
                          </button>
                        </form>
                      ) : null}
                    </div>
                  )
                ) : (
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
                )}
              </motion.div>
            </AnimatePresence>
            {loading ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <Loader2 className="size-7 animate-spin text-soft-white/55" aria-hidden="true" />
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none flex items-end justify-between gap-4 p-4 sm:p-6">
            <div className="pointer-events-auto flex items-center gap-2">
              {enableSelects && photo.mediaType === "image" ? (
                <SelectToggle photoId={photo.id} variant="lightbox" />
              ) : null}
              {enableDownload && slug ? (
                <PhotoDownloadButton slug={slug} photoId={photo.id} />
              ) : null}
              <PhotoShareButton photoId={photo.id} />
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
