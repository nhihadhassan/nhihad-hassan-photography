import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, Unlock } from "lucide-react";
import type { PublicGallery } from "@/lib/public-gallery";
import { brandConfig } from "@/lib/config";
import { formatCoverDate } from "@/lib/utils";
import { GalleryPasswordGate } from "@/components/gallery-password-gate";

const TITLE_SHADOW =
  "[text-shadow:0_2px_18px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.7)]";
const META_SHADOW =
  "[text-shadow:0_2px_12px_rgba(0,0,0,0.85),0_1px_2px_rgba(0,0,0,0.7)]";

export function GalleryCover({ gallery }: { gallery: PublicGallery }) {
  const showGate = gallery.hasPassword && !gallery.isUnlocked;
  const layout = gallery.coverLayout;
  const focal = `${gallery.coverFocalX}% ${gallery.coverFocalY}%`;
  const isSplit = layout === "split";

  const title = (
    <h1
      className={`font-display font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-3xl text-soft-white sm:text-5xl lg:text-6xl ${
        isSplit ? "" : TITLE_SHADOW
      }`}
    >
      {gallery.title}
    </h1>
  );

  const date = gallery.date ? (
    <p
      className={`mt-5 font-display text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm ${
        isSplit ? "text-soft-white/70" : `text-soft-white ${META_SHADOW}`
      }`}
    >
      {formatCoverDate(gallery.date)}
    </p>
  ) : null;

  const action = (
    <div className="mt-9 w-full max-w-xs">
      {showGate ? (
        <GalleryPasswordGate slug={gallery.slug} galleryTitle={gallery.title} />
      ) : (
        <a
          href="#gallery"
          className={`inline-flex items-center justify-center border border-soft-white/80 px-9 py-3.5 font-display text-xs font-semibold uppercase tracking-[0.24em] text-soft-white transition hover:border-soft-white hover:bg-soft-white/15 ${
            isSplit ? "bg-transparent" : `bg-ink/25 backdrop-blur-sm ${META_SHADOW}`
          }`}
        >
          View Gallery
        </a>
      )}
    </div>
  );

  const brand = (
    <Link
      href="/"
      className={`font-display text-[0.7rem] font-medium uppercase tracking-[0.3em] text-soft-white/85 transition hover:text-soft-white ${
        isSplit ? "" : META_SHADOW
      }`}
    >
      {brandConfig.name}
    </Link>
  );

  const privacyBadge = gallery.hasPassword ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-soft-white/20 bg-ink/35 px-3 py-2 text-xs text-soft-white/70 backdrop-blur">
      {gallery.isUnlocked ? (
        <>
          <Unlock className="size-3.5" aria-hidden="true" />
          Unlocked
        </>
      ) : (
        <>
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Private
        </>
      )}
    </span>
  ) : null;

  // ── Split layout: photo on one side, solid panel with the title on the other ─
  if (isSplit) {
    return (
      <section
        id="cover"
        className="relative grid min-h-[100dvh] grid-rows-[55vh_1fr] bg-ink text-soft-white md:grid-cols-[3fr_2fr] md:grid-rows-1"
      >
        <div className="relative overflow-hidden">
          <Image
            src={gallery.imageUrl}
            alt={gallery.alt}
            fill
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
            style={{ objectPosition: focal }}
            unoptimized={gallery.hasRealPhotos}
          />
          {privacyBadge ? (
            <div className="absolute right-4 top-4 z-10">{privacyBadge}</div>
          ) : null}
        </div>
        <div className="flex flex-col px-8 py-10 sm:px-12 md:py-12">
          <div className="flex flex-1 flex-col items-start justify-center text-left">
            {title}
            {date}
            {action}
          </div>
          <div className="pt-8">{brand}</div>
        </div>
      </section>
    );
  }

  // ── Overlay layouts: full-bleed photo with a positioned title block ──────────
  const blockPosition =
    layout === "left"
      ? "items-start justify-end pb-20 text-left"
      : layout === "bottom"
        ? "items-center justify-end pb-16 text-center"
        : "items-center justify-center text-center";

  return (
    <section
      id="cover"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-ink text-soft-white"
    >
      <Image
        src={gallery.imageUrl}
        alt={gallery.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: focal }}
        unoptimized={gallery.hasRealPhotos}
      />
      {/* Soft darkening so text stays legible. Bottom layout gets a stronger base. */}
      <div
        className={
          layout === "bottom"
            ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.45)_0%,rgba(8,8,8,0.05)_35%,rgba(8,8,8,0.85)_100%)]"
            : "absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.5)_0%,rgba(8,8,8,0.12)_26%,rgba(8,8,8,0.05)_50%,rgba(8,8,8,0.6)_100%)]"
        }
      />

      {gallery.hasPassword ? (
        <div className="relative z-10 flex justify-end px-4 py-6 sm:px-8">{privacyBadge}</div>
      ) : null}

      <div className={`relative z-10 flex flex-1 flex-col px-6 sm:px-10 ${blockPosition}`}>
        {title}
        {date}
        {action}
      </div>

      <div className="relative z-10 pb-8 text-center">{brand}</div>
    </section>
  );
}
