"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getGalleryCoverFont, GALLERY_COVER_FONTS } from "@/lib/gallery-cover-fonts";

/**
 * The cover renders full-bleed at 100dvh, so the crop differs enormously
 * between a wide desktop window and a tall phone. Both are previewed live:
 * on desktop a landscape photo is barely cropped and the focal point looks
 * like it does nothing, while on mobile it decides the whole composition.
 */
const CROP_PREVIEWS = [
  { label: "Desktop", ratio: 16 / 9 },
  { label: "Mobile", ratio: 9 / 19.5 },
] as const;

type CoverDesignFieldsProps = {
  coverImageUrl?: string | null;
  initialFocalX?: number;
  initialFocalY?: number;
  initialLayout?: string;
  initialFont?: string;
};

const LAYOUTS = [
  { value: "center", label: "Center" },
  { value: "left", label: "Left" },
  { value: "bottom", label: "Bottom bar" },
  { value: "split", label: "Split" },
] as const;

/** Tiny visual of where the title sits for each layout. */
function LayoutThumb({ variant, active }: { variant: string; active: boolean }) {
  const bar = active ? "bg-admin-accent" : "bg-admin-ink/30";
  return (
    <span
      className={
        "relative block h-10 w-full overflow-hidden rounded-sm " +
        (active ? "bg-admin-copper/20" : "bg-admin-ink/8")
      }
      aria-hidden="true"
    >
      {variant === "center" && (
        <span className={`absolute left-1/2 top-1/2 h-1 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full ${bar}`} />
      )}
      {variant === "left" && (
        <span className={`absolute bottom-2 left-2 h-1 w-6 rounded-full ${bar}`} />
      )}
      {variant === "bottom" && (
        <>
          <span className="absolute inset-x-0 bottom-0 h-3 bg-admin-ink/15" />
          <span className={`absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full ${bar}`} />
        </>
      )}
      {variant === "split" && (
        <>
          <span className="absolute inset-y-0 right-0 w-1/2 bg-admin-ink/12" />
          <span className={`absolute right-[12%] top-1/2 h-1 w-5 -translate-y-1/2 rounded-full ${bar}`} />
        </>
      )}
    </span>
  );
}

export function CoverDesignFields({
  coverImageUrl,
  initialFocalX = 50,
  initialFocalY = 50,
  initialLayout = "center",
  initialFont = "montserrat",
}: CoverDesignFieldsProps) {
  const [focalX, setFocalX] = useState(initialFocalX);
  const [focalY, setFocalY] = useState(initialFocalY);
  const [layout, setLayout] = useState(initialLayout);
  const [font, setFont] = useState(() => getGalleryCoverFont(initialFont).value);

  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const applyFromPoint = useCallback((clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const x = Math.round(((clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((clientY - rect.top) / rect.height) * 100);
    setFocalX(Math.min(100, Math.max(0, x)));
    setFocalY(Math.min(100, Math.max(0, y)));
  }, []);

  // Dragging continues outside the image, so the listeners live on the window
  // while a drag is in progress.
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      applyFromPoint(e.clientX, e.clientY);
    };
    const stop = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging, applyFromPoint]);

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = map[e.key];
    if (!delta) return;
    e.preventDefault();
    setFocalX((v) => Math.min(100, Math.max(0, v + delta[0])));
    setFocalY((v) => Math.min(100, Math.max(0, v + delta[1])));
  };

  return (
    <div className="grid gap-5 md:col-span-2">
      <input type="hidden" name="cover_focal_x" value={focalX} />
      <input type="hidden" name="cover_focal_y" value={focalY} />
      <input type="hidden" name="cover_layout" value={layout} />
      <input type="hidden" name="cover_font" value={font} />

      {/* Layout template */}
      <div className="grid gap-2">
        <span className="text-sm font-medium">Cover layout</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LAYOUTS.map((opt) => {
            const active = layout === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLayout(opt.value)}
                aria-pressed={active}
                className={
                  "flex flex-col items-center gap-2 rounded-md border p-2 text-xs transition " +
                  (active
                    ? "border-admin-accent bg-admin-copper/10 text-admin-accent"
                    : "border-admin-ink/12 text-admin-ink/65 hover:border-admin-ink/30")
                }
              >
                <LayoutThumb variant={opt.value} active={active} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cover title font */}
      <div className="grid gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Cover title font</span>
          <span className="text-xs text-admin-ink/60">
            {getGalleryCoverFont(font).label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {GALLERY_COVER_FONTS.map((option) => {
            const active = font === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFont(option.value)}
                aria-pressed={active}
                aria-label={`Use ${option.label} for the cover title`}
                className={
                  "min-h-20 rounded-md border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-copper/40 " +
                  (active
                    ? "border-admin-accent bg-admin-copper/10 text-admin-ink"
                    : "border-admin-ink/12 bg-white/35 text-admin-ink/70 hover:border-admin-ink/30 hover:bg-white/70")
                }
              >
                <span
                  className="block truncate text-lg leading-none"
                  style={{
                    fontFamily: `var(${option.cssVariable}, ${option.familyFallback})`,
                    fontWeight: option.weight,
                  }}
                >
                  Gallery Title
                </span>
                <span className="mt-2 block truncate text-[0.65rem] font-medium tracking-wide text-admin-ink/60">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-xs text-admin-ink/65">
          Previewed in title case. The public cover keeps the gallery title exactly as entered.
        </span>
      </div>

      {/* Focal point */}
      <div className="grid gap-2">
        <span className="text-sm font-medium">Cover focal point</span>
        {coverImageUrl ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex justify-center rounded-md border border-admin-ink/10 bg-admin-ink/5 p-2">
                <div
                  ref={frameRef}
                  role="application"
                  aria-label="Cover focal point"
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDragging(true);
                    applyFromPoint(e.clientX, e.clientY);
                  }}
                  onKeyDown={nudge}
                  className="relative inline-block cursor-crosshair touch-none select-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-admin-copper"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    draggable={false}
                    className="block max-h-[360px] w-auto max-w-full select-none rounded-sm"
                  />
                  <span
                    className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                    style={{
                      left: `${focalX}%`,
                      top: `${focalY}%`,
                      boxShadow: "0 0 0 2px rgba(0,0,0,0.45)",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                    style={{ left: `${focalX}%`, top: `${focalY}%` }}
                  />
                </div>
              </div>

              {/* Live crop previews: what the client actually sees. */}
              <div className="flex gap-3">
                {CROP_PREVIEWS.map((preview) => (
                  <div key={preview.label} className="grid content-start gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-ink/65">
                      {preview.label}
                    </span>
                    <div
                      className="overflow-hidden rounded-sm border border-admin-ink/10 bg-admin-ink/5"
                      style={{ width: 132, height: 132 / preview.ratio }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImageUrl}
                        alt={`${preview.label} cover crop preview`}
                        draggable={false}
                        className="size-full select-none object-cover"
                        style={{ objectPosition: `${focalX}% ${focalY}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-xs text-admin-ink/65">
              Drag the point onto what should stay in view, such as a face. Arrow keys nudge it,
              Shift speeds that up. The previews show the real crop: a wide photo barely moves on
              desktop, while the mobile crop shifts a lot. Current: {focalX}% / {focalY}%.
            </span>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-admin-ink/15 bg-white/40 px-4 py-6 text-center text-xs text-admin-ink/65">
            Set a cover photo first (use Cover in the Photos tab, or a cover image URL above), then
            you can position the focal point here.
          </p>
        )}
      </div>
    </div>
  );
}
