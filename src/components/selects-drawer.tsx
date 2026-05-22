"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import { useSelects } from "@/components/selects-provider";
import { submitFavorites } from "@/app/galleries/[slug]/favorites/actions";
import type { PublicGalleryPhoto } from "@/lib/public-gallery";

type SelectsDrawerProps = {
  slug: string;
  photos: PublicGalleryPhoto[];
  downloadEnabled?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SelectsDrawer({ slug, photos, downloadEnabled = false }: SelectsDrawerProps) {
  const { drawerOpen, closeDrawer, selectedIds, remove, clear } = useSelects();
  const reduceMotion = useReducedMotion();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ count: number } | null>(null);
  const [trackedOpen, setTrackedOpen] = useState(drawerOpen);

  // Reset transient submission errors when the drawer transitions to closed.
  // Render-time pattern (React docs) avoids the set-state-in-effect rule.
  if (trackedOpen !== drawerOpen) {
    setTrackedOpen(drawerOpen);
    if (!drawerOpen) setError(null);
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!drawerOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Build the visible selected list, preserving order and filtering to known photos.
  const selectedPhotos = selectedIds
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is PublicGalleryPhoto => Boolean(p));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (selectedPhotos.length === 0) {
      setError("Pick at least one photo before submitting.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      const result = await submitFavorites({
        slug,
        visitorName: name.trim() || null,
        visitorEmail: trimmedEmail,
        notes: notes.trim() || null,
        photoIds: selectedPhotos.map((p) => p.id),
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setSubmitted({ count: result.count });
      clear();
    });
  };

  const onClose = () => {
    setSubmitted(null);
    setError(null);
    closeDrawer();
  };

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <motion.div
          key="selects-drawer-root"
          className="fixed inset-0 z-[110] flex flex-col sm:flex-row sm:items-stretch sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          role="dialog"
          aria-modal="true"
          aria-label="Review selects"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review"
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
          />

          <motion.div
            key="selects-drawer-panel"
            initial={reduceMotion ? false : { y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: "100%", opacity: 0 }}
            transition={transition}
            className="relative z-10 mt-auto flex h-[88dvh] w-full flex-col rounded-t-2xl bg-[#f3eee5] text-ink shadow-[0_-30px_120px_-40px_rgba(0,0,0,0.5)] sm:mt-0 sm:h-full sm:max-w-md sm:rounded-none sm:border-l sm:border-ink/10"
          >
            <header className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink/55">My selects</p>
                <h2 className="mt-1 font-serif text-2xl leading-none">
                  {submitted
                    ? "Sent"
                    : `${selectedPhotos.length} photo${selectedPhotos.length === 1 ? "" : "s"}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-10 items-center justify-center rounded-full border border-ink/12 text-ink/68 transition hover:bg-ink hover:text-soft-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            {submitted ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-[#3f6e4a]/15 text-[#3f6e4a]">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </span>
                <p className="mt-5 font-serif text-3xl leading-tight">
                  Your selects have been sent.
                </p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-ink/58">
                  {submitted.count} photo{submitted.count === 1 ? "" : "s"} delivered to the
                  photographer. You can close this drawer.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-ink/14 bg-ink px-5 text-sm font-medium text-soft-white transition hover:bg-charcoal"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 pt-4 sm:px-6">
                  {selectedPhotos.length === 0 ? (
                    <p className="mt-8 text-center text-sm text-ink/55">
                      Tap the heart on any photo to add it to your selects.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                      {selectedPhotos.map((photo) => {
                        const aspect =
                          photo.width && photo.height ? photo.width / photo.height : 1;
                        return (
                          <li key={photo.id} className="group relative overflow-hidden rounded-sm bg-ink/10">
                            <div className="relative" style={{ aspectRatio: aspect || 1 }}>
                              <Image
                                src={photo.thumbnailUrl}
                                alt={photo.alt}
                                fill
                                sizes="(min-width: 640px) 12vw, 30vw"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(photo.id)}
                              aria-label={`Remove ${photo.alt}`}
                              className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-ink/72 text-soft-white opacity-0 transition group-hover:opacity-100"
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {downloadEnabled && selectedPhotos.length > 0 ? (
                  <form
                    action={`/api/galleries/${encodeURIComponent(slug)}/download`}
                    method="POST"
                    className="flex items-center justify-between gap-3 border-t border-ink/10 bg-[#fbf8f1] px-5 py-3 sm:px-6"
                  >
                    <input type="hidden" name="scope" value="selects" />
                    {selectedPhotos.map((p) => (
                      <input key={p.id} type="hidden" name="photo_ids" value={p.id} />
                    ))}
                    <p className="text-xs text-ink/55">
                      Download your selects as a ZIP. No need to send them first.
                    </p>
                    <button
                      type="submit"
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-ink/14 px-4 text-sm font-medium text-ink/75 transition hover:bg-ink hover:text-soft-white"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download
                    </button>
                  </form>
                ) : null}

                <form
                  onSubmit={onSubmit}
                  className="grid gap-3 border-t border-ink/10 bg-[#fbf8f1] px-5 py-4 sm:px-6"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-ink/68">Name (optional)</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm"
                        autoComplete="name"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-ink/68">Email</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm"
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-ink/68">Notes (optional)</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      className="rounded-md border border-ink/12 bg-white px-3 py-2 text-sm"
                      placeholder="Anything you'd like me to know"
                    />
                  </label>

                  {error ? (
                    <p
                      role="alert"
                      className="rounded-md border border-[#8a2f24]/25 bg-[#8a2f24]/10 px-3 py-2 text-sm text-[#7a2e25]"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending || selectedPhotos.length === 0}
                    className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-soft-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Sending
                      </>
                    ) : (
                      `Send ${selectedPhotos.length} select${selectedPhotos.length === 1 ? "" : "s"}`
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
