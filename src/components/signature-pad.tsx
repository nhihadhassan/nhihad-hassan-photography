"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Type as TypeIcon } from "lucide-react";

type Mode = "draw" | "type";

const SIGNATURE_FONT = '"Dancing Script"';

/** Renders `name` in the signature script font onto an offscreen canvas and returns a PNG data URL. */
function renderTypedSignature(name: string): string | null {
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
  ctx.font = `${size}px ${SIGNATURE_FONT}`;
  while (ctx.measureText(trimmed).width > width - 48 && size > 24) {
    size -= 2;
    ctx.font = `${size}px ${SIGNATURE_FONT}`;
  }
  ctx.fillText(trimmed, width / 2, height / 2 + 4);
  return canvas.toDataURL("image/png");
}

/**
 * Lets the client either draw their signature or type their name and have it
 * rendered in a script font, the same choice DocuSign-style e-sign tools
 * offer. Both modes call `onChange` with the same shape (a PNG data URL, or
 * null when empty), so the parent form and server never need to know which
 * one was used.
 */
export function SignaturePad({ onChange, defaultName }: { onChange: (dataUrl: string | null) => void; defaultName?: string }) {
  const [mode, setMode] = useState<Mode>("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const [typedName, setTypedName] = useState(defaultName ?? "");

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
      if (!cancelled) onChange(renderTypedSignature(typedName));
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      fonts.load(`64px ${SIGNATURE_FONT}`).then(apply).catch(apply);
    } else {
      apply();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedName]);

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
      onChange(renderTypedSignature(typedName));
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
            style={{ fontFamily: "var(--font-signature)" }}
          >
            {typedName.trim() || <span className="text-base italic text-ink/30">Your signature preview</span>}
          </p>
        </div>
      )}
    </div>
  );
}
