"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Type as TypeIcon } from "lucide-react";

type Mode = "draw" | "type";

type SignatureStyle = {
  id: string;
  label: string;
  font: string;
  cssVar: string;
};

const SIGNATURE_STYLES: SignatureStyle[] = [
  { id: "dancing", label: "Flowing", font: '"Dancing Script"', cssVar: "var(--font-signature-dancing)" },
  { id: "vibes", label: "Elegant", font: '"Great Vibes"', cssVar: "var(--font-signature-vibes)" },
  { id: "brush", label: "Brush", font: '"Alex Brush"', cssVar: "var(--font-signature-brush)" },
  { id: "handwritten", label: "Handwritten", font: '"Homemade Apple"', cssVar: "var(--font-signature-handwritten)" },
];

/** Renders `name` in the given signature font onto an offscreen canvas and returns a PNG data URL. */
function renderTypedSignature(name: string, font: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const canvas = document.createElement("canvas");
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const width = 600;
  const height = 150;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#17130f";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  let size = 64;
  ctx.font = `${size}px ${font}`;
  while (ctx.measureText(trimmed).width > width - 48 && size > 24) {
    size -= 2;
    ctx.font = `${size}px ${font}`;
  }
  ctx.fillText(trimmed, width / 2, height / 2 + 4);
  return canvas.toDataURL("image/png");
}

/**
 * Lets the client either draw their signature or type their name and have it
 * rendered in one of several script fonts, the same choice DocuSign-style
 * e-sign tools offer. Both modes call `onChange` with the same shape (a PNG
 * data URL, or null when empty), so the parent form and server never need to
 * know which one was used.
 */
export function SignaturePad({ onChange, defaultName }: { onChange: (dataUrl: string | null) => void; defaultName?: string }) {
  const [mode, setMode] = useState<Mode>("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const [typedName, setTypedName] = useState(defaultName ?? "");
  const [styleId, setStyleId] = useState(SIGNATURE_STYLES[0].id);
  const style = SIGNATURE_STYLES.find((s) => s.id === styleId) ?? SIGNATURE_STYLES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "draw") return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#17130f";
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "type") return;
    let cancelled = false;
    const apply = () => {
      if (!cancelled) onChange(renderTypedSignature(typedName, style.font));
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      fonts.load(`64px ${style.font}`).then(apply).catch(apply);
    } else {
      apply();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedName, styleId]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
    if (empty) setEmpty(false);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasInk.current) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setEmpty(true);
    onChange(null);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    if (next === "draw") {
      clear();
    } else {
      onChange(renderTypedSignature(typedName, style.font));
    }
  };

  return (
    <div>
      <div className="mb-2 inline-flex rounded-sm border border-ink/15 bg-white/50 p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => switchMode("draw")}
          aria-pressed={mode === "draw"}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition ${
            mode === "draw" ? "bg-ink text-soft-white" : "text-ink/60 hover:text-ink"
          }`}
        >
          <PenLine className="size-3.5" aria-hidden="true" />
          Draw
        </button>
        <button
          type="button"
          onClick={() => switchMode("type")}
          aria-pressed={mode === "type"}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition ${
            mode === "type" ? "bg-ink text-soft-white" : "text-ink/60 hover:text-ink"
          }`}
        >
          <TypeIcon className="size-3.5" aria-hidden="true" />
          Type
        </button>
      </div>

      {mode === "draw" ? (
        <>
          <div className="relative overflow-hidden rounded-sm border-b border-ink/20 bg-ink/[0.035]">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="block h-24 w-full touch-none"
            />
            {empty ? (
              <span className="pointer-events-none absolute inset-0 flex items-center gap-2 px-4 text-sm text-ink/40">
                <PenLine className="size-3.5 shrink-0" aria-hidden="true" />
                Click here to sign
              </span>
            ) : null}
          </div>
          {!empty ? (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/55 transition hover:text-ink"
              >
                <Eraser className="size-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-sm border-b border-ink/20 bg-ink/[0.035] p-4">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full name"
            aria-label="Type your signature"
            className="w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
          />
          <p
            className="mt-2 h-16 overflow-hidden text-[40px] leading-[1] text-ink"
            style={{ fontFamily: style.cssVar }}
          >
            {typedName.trim() || <span className="text-base italic text-ink/30">Your signature preview</span>}
          </p>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {SIGNATURE_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyleId(s.id)}
                aria-pressed={s.id === styleId}
                className={`flex flex-col items-center gap-1 rounded-sm border px-1.5 py-2 transition ${
                  s.id === styleId
                    ? "border-[#8b6444] bg-[#8b6444]/8"
                    : "border-ink/15 bg-white/40 hover:border-ink/30"
                }`}
              >
                <span
                  className="block h-8 w-full overflow-hidden text-ellipsis whitespace-nowrap text-[22px] leading-[1.5] text-ink"
                  style={{ fontFamily: s.cssVar }}
                >
                  {(typedName.trim() || "Sign").slice(0, 10)}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink/50">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
