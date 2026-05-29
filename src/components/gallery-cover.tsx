import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, Unlock } from "lucide-react";
import type { PublicGallery } from "@/lib/public-gallery";
import { brandConfig } from "@/lib/config";
import { formatDisplayDate } from "@/lib/utils";
import { GalleryPasswordGate } from "@/components/gallery-password-gate";

export function GalleryCover({ gallery }: { gallery: PublicGallery }) {
  const showGate = gallery.hasPassword && !gallery.isUnlocked;

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
        unoptimized={gallery.hasRealPhotos}
      />
      {/* Soft top and bottom darkening so the title and brand stay legible. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.5)_0%,rgba(8,8,8,0.12)_26%,rgba(8,8,8,0.05)_50%,rgba(8,8,8,0.6)_100%)]" />

      {/* Privacy badge */}
      {gallery.hasPassword ? (
        <div className="relative z-10 flex justify-end px-4 py-6 sm:px-8">
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
        </div>
      ) : null}

      {/* Centered title block */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif uppercase leading-[0.95] tracking-[0.06em] text-5xl sm:text-7xl lg:text-8xl">
          {gallery.title}
        </h1>
        {gallery.date ? (
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-soft-white/80 sm:text-sm">
            {formatDisplayDate(gallery.date)}
          </p>
        ) : null}

        <div className="mt-9 w-full max-w-xs">
          {showGate ? (
            <GalleryPasswordGate slug={gallery.slug} galleryTitle={gallery.title} />
          ) : (
            <a
              href="#gallery"
              className="inline-flex items-center justify-center border border-soft-white/45 px-9 py-3.5 text-xs uppercase tracking-[0.24em] text-soft-white transition hover:border-soft-white hover:bg-soft-white/10"
            >
              View Gallery
            </a>
          )}
        </div>
      </div>

      {/* Brand wordmark */}
      <div className="relative z-10 pb-8 text-center">
        <Link
          href="/"
          className="text-[0.7rem] uppercase tracking-[0.3em] text-soft-white/70 transition hover:text-soft-white"
        >
          {brandConfig.name}
        </Link>
      </div>
    </section>
  );
}
