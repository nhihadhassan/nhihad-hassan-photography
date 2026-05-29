"use client";

import { useState } from "react";

type CoverDesignFieldsProps = {
  coverImageUrl?: string | null;
  initialFocalX?: number;
  initialFocalY?: number;
  initialLayout?: string;
};

const LAYOUTS = [
  { value: "center", label: "Center" },
  { value: "left", label: "Left" },
  { value: "bottom", label: "Bottom bar" },
  { value: "split", label: "Split" },
] as const;

/** Tiny visual of where the title sits for each layout. */
function LayoutThumb({ variant, active }: { variant: string; active: boolean }) {
  const bar = active ? "bg-[#9b744f]" : "bg-[#17130f]/30";
  return (
    <span
      className={
        "relative block h-10 w-full overflow-hidden rounded-sm " +
        (active ? "bg-[#b98257]/20" : "bg-[#17130f]/8")
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
          <span className="absolute inset-x-0 bottom-0 h-3 bg-[#17130f]/15" />
          <span className={`absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full ${bar}`} />
        </>
      )}
      {variant === "split" && (
        <>
          <span className="absolute inset-y-0 right-0 w-1/2 bg-[#17130f]/12" />
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
}: CoverDesignFieldsProps) {
  const [focalX, setFocalX] = useState(initialFocalX);
  const [focalY, setFocalY] = useState(initialFocalY);
  const [layout, setLayout] = useState(initialLayout);

  const onPick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocalX(Math.min(100, Math.max(0, x)));
    setFocalY(Math.min(100, Math.max(0, y)));
  };

  return (
    <div className="grid gap-5 md:col-span-2">
      <input type="hidden" name="cover_focal_x" value={focalX} />
      <input type="hidden" name="cover_focal_y" value={focalY} />
      <input type="hidden" name="cover_layout" value={layout} />

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
                    ? "border-[#9b744f] bg-[#b98257]/10 text-[#9b744f]"
                    : "border-[#17130f]/12 text-[#17130f]/65 hover:border-[#17130f]/30")
                }
              >
                <LayoutThumb variant={opt.value} active={active} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Focal point */}
      <div className="grid gap-2">
        <span className="text-sm font-medium">Cover focal point</span>
        {coverImageUrl ? (
          <>
            <div className="flex justify-center rounded-md border border-[#17130f]/10 bg-[#17130f]/5 p-2">
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  onClick={onPick}
                  draggable={false}
                  className="block max-h-[420px] w-auto max-w-full cursor-crosshair select-none rounded-sm"
                />
                <span
                  className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                  style={{
                    left: `${focalX}%`,
                    top: `${focalY}%`,
                    boxShadow: "0 0 0 2px rgba(0,0,0,0.45)",
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-[#17130f]/45">
              Click the spot to keep in view (e.g. a face). The cover image shifts to favour it.
              Current: {focalX}% / {focalY}%.
            </span>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-[#17130f]/15 bg-white/40 px-4 py-6 text-center text-xs text-[#17130f]/50">
            Set a cover photo first (use Cover in the Photos tab, or a cover image URL above), then
            you can position the focal point here.
          </p>
        )}
      </div>
    </div>
  );
}
