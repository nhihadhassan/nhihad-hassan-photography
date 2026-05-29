import { ArrowUp, Download, ImageOff } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { DownloadAllButton } from "@/components/download-all-button";
import { GalleryGrid } from "@/components/gallery-grid";
import { SelectsToolbarButton } from "@/components/selects-toolbar-button";
import { SlideshowButton } from "@/components/slideshow-button";
import { brandConfig } from "@/lib/config";
import type { PublicGallery } from "@/lib/public-gallery";
import { formatCoverDate } from "@/lib/utils";

export function GalleryContent({ gallery }: { gallery: PublicGallery }) {
  const hasPhotos = gallery.photos.length > 0;
  const realDownloads = gallery.hasRealPhotos && gallery.downloadEnabled;

  return (
    <div id="gallery" className="bg-[#f3eee5] text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-[#f3eee5]/92 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#cover" className="text-sm font-medium tracking-wide">
            {brandConfig.name}
          </a>
          <div className="hidden items-center gap-2 md:flex">
            {hasPhotos ? <SelectsToolbarButton /> : null}
            <CopyLinkButton />
            {hasPhotos ? <SlideshowButton /> : null}
            {realDownloads ? (
              <DownloadAllButton slug={gallery.slug} photoCount={gallery.photos.length} />
            ) : (
              <button
                type="button"
                aria-disabled="true"
                tabIndex={-1}
                title="Downloads aren't enabled for this gallery"
                className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-full border border-ink/10 px-3 text-sm text-ink/35"
              >
                <Download className="size-4" aria-hidden="true" />
                Downloads
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="top" className="px-4 pb-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <a href="#cover" className="text-sm text-ink/55 hover:text-ink">
                Back to cover
              </a>
              <h1 className="mt-6 font-display font-extrabold uppercase leading-tight tracking-[-0.01em] text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem]">{gallery.title}</h1>
              <p className="mt-4 text-base text-ink/58">
                {gallery.date ? formatCoverDate(gallery.date) : "Date to be announced"} ·{" "}
                {gallery.location ?? "Private gallery"}
              </p>
            </div>
            <div className="text-sm text-ink/64 sm:w-40">
              <div className="border-t border-ink/15 pt-3">
                <span className="block text-2xl font-semibold text-ink">{gallery.photos.length}</span>
                Photos
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 md:hidden">
            {hasPhotos ? (
              <SelectsToolbarButton className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm" />
            ) : null}
            <CopyLinkButton className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/12 px-4 text-sm text-ink/68 transition hover:bg-ink hover:text-soft-white" />
            {hasPhotos ? <SlideshowButton className="min-h-11 px-4" /> : null}
            {realDownloads ? (
              <DownloadAllButton
                slug={gallery.slug}
                photoCount={gallery.photos.length}
                className="!min-h-11 !text-sm"
              />
            ) : (
              <button
                type="button"
                aria-disabled="true"
                tabIndex={-1}
                title="Downloads aren't enabled for this gallery"
                className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full border border-ink/10 px-4 text-sm text-ink/35"
              >
                <Download className="size-4" aria-hidden="true" />
                Downloads
              </button>
            )}
          </div>

          {hasPhotos ? (
            <GalleryGrid
              photos={gallery.photos}
              unoptimizedImages={gallery.hasRealPhotos}
              enableSelects={gallery.hasRealPhotos}
              enableDownload={realDownloads}
              slug={gallery.slug}
            />
          ) : (
            <div className="mt-12 rounded-[2px] border border-ink/12 bg-ink/4 px-6 py-16 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink/8">
                <ImageOff className="size-5 text-ink/60" aria-hidden="true" />
              </span>
              <p className="mt-5 font-serif text-3xl text-ink">No photos here yet.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/58">
                This gallery is published but doesn&apos;t have any photos to show. Check back soon, or
                reach out if you expected to see something here.
              </p>
            </div>
          )}

          {hasPhotos ? (
            <div className="mt-14 flex justify-center">
              <ButtonLink href="#cover" variant="light">
                <ArrowUp className="size-4" aria-hidden="true" />
                Back to top
              </ButtonLink>
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
