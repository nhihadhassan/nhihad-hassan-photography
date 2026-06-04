import Image from "next/image";
import { Fragment } from "react";
import type { ResolvedBlock } from "@/lib/journal-types";

/** Inline **bold** support inside paragraphs / headings. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function JournalImage({ src, alt }: { src: string; alt?: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      fill
      sizes="(min-width: 768px) 768px, 100vw"
      className="object-cover"
      unoptimized={src.startsWith("http")}
    />
  );
}

function Block({ block }: { block: ResolvedBlock }) {
  switch (block.type) {
    case "heading": {
      const align = block.align === "center" ? "text-center" : "";
      const size = block.level === 3 ? "text-2xl" : "text-3xl sm:text-4xl";
      return (
        <h2 className={`mt-12 font-serif font-medium leading-tight tracking-tight first:mt-0 ${size} ${align}`}>
          {inline(block.text)}
        </h2>
      );
    }
    case "paragraph": {
      const align = block.align === "center" ? "text-center" : "";
      return (
        <p className={`mt-5 leading-[1.85] text-soft-white/75 first:mt-0 ${align}`}>
          {inline(block.text)}
        </p>
      );
    }
    case "quote":
      return (
        <figure className="my-10 border-l-2 border-copper/60 pl-5 first:mt-0">
          <blockquote className="font-serif text-2xl leading-snug text-soft-white/90">
            {block.text}
          </blockquote>
          {block.attribution ? (
            <figcaption className="mt-3 text-xs uppercase tracking-[0.18em] text-soft-white/55">
              {block.attribution}
            </figcaption>
          ) : null}
        </figure>
      );
    case "image": {
      const full = block.width === "full";
      return (
        <figure className={`my-9 first:mt-0 ${full ? "sm:-mx-24 lg:-mx-40" : ""}`}>
          <div className="relative aspect-[3/2] overflow-hidden rounded-[2px] bg-soft-white/8">
            <JournalImage src={block.src} alt={block.alt || block.caption} />
          </div>
          {block.caption ? (
            <figcaption className="mt-2.5 text-center text-xs italic text-soft-white/55">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "image_row": {
      const shown = block.srcs.filter((s) => s.src);
      if (shown.length === 0) return null;
      return (
        <figure className="my-9 first:mt-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {shown.map((s, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-[2px] bg-soft-white/8">
                <JournalImage src={s.src} alt={s.alt} />
              </div>
            ))}
          </div>
          {block.caption ? (
            <figcaption className="mt-2.5 text-center text-xs italic text-soft-white/55">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "divider":
      return <hr className="my-12 border-soft-white/12" />;
    default:
      return null;
  }
}

export function JournalBlocks({
  blocks,
  bodyFont,
}: {
  blocks: ResolvedBlock[];
  bodyFont?: string | null;
}) {
  const fontClass = bodyFont === "serif" ? "font-serif" : "font-sans";
  return (
    <div className={`text-[1.0625rem] ${fontClass}`}>
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
}
