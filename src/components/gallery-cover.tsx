import Image from "next/image";
import { LockKeyhole, ArrowRight, Unlock } from "lucide-react";
import type { PublicGallery } from "@/lib/public-gallery";
import { brandConfig } from "@/lib/config";
import { formatDisplayDate } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { GalleryPasswordGate } from "@/components/gallery-password-gate";

export function GalleryCover({ gallery }: { gallery: PublicGallery }) {
  const showGate = gallery.hasPassword && !gallery.isUnlocked;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-ink text-soft-white">
      <Image
        src={gallery.imageUrl}
        alt={gallery.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        unoptimized={gallery.hasRealPhotos}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.78),rgba(8,8,8,0.25)_48%,rgba(8,8,8,0.72)),linear-gradient(180deg,rgba(8,8,8,0.4),rgba(8,8,8,0.88))]" />
      <div className="relative z-10 flex min-h-[100dvh] flex-col px-4 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <p className="text-sm font-medium tracking-wide">{brandConfig.name}</p>
          {gallery.hasPassword ? (
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
          ) : null}
        </header>
        <section className="flex flex-1 items-end pb-10 pt-24 lg:pb-16">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.42fr)] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-beige/75">
                {[gallery.location, gallery.clientName].filter(Boolean).join(" · ") || "Private gallery"}
              </p>
              <h1 className="mt-5 max-w-4xl font-serif text-7xl font-medium leading-[0.84] tracking-tight text-soft-white sm:text-8xl lg:text-[8.5rem]">
                {gallery.title}
              </h1>
              <p className="mt-6 text-xl text-soft-white/72">
                {gallery.date ? formatDisplayDate(gallery.date) : ""}
              </p>
            </div>
            <div className="border-t border-soft-white/18 pt-6 lg:border-l lg:border-t-0 lg:pl-8">
              <p className="text-sm leading-6 text-soft-white/70">
                {gallery.description ?? "A private gallery — prepared for delivery and ready to share with the people who matter."}
              </p>
              <div className="mt-7 flex flex-col gap-3">
                {showGate ? (
                  <GalleryPasswordGate slug={gallery.slug} galleryTitle={gallery.title} />
                ) : (
                  <ButtonLink
                    href={`/galleries/${gallery.slug}/view`}
                    className="w-full justify-between"
                  >
                    View Gallery
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
