import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { InquiryCallout } from "@/components/inquiry-callout";
import { getPublicGalleryIndex } from "@/lib/public-gallery";
import { formatDisplayDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Galleries",
  description:
    "Browse client galleries from Nhihad Hassan Photography, a Toronto-based wedding, couples, and event photographer.",
  openGraph: {
    title: "Galleries | Nhihad Hassan Photography",
    description:
      "A selection of client galleries from weddings, couples, and events around Toronto.",
  },
};

// Cover URLs are signed and time-limited, so this page must render per request.
export const dynamic = "force-dynamic";

export default async function GalleriesPage() {
  const galleries = await getPublicGalleryIndex();

  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <div className="grid gap-8 border-b border-soft-white/12 pb-10 lg:grid-cols-[0.9fr_1fr] lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-copper">Galleries</p>
                <h1 className="mt-4 font-serif text-6xl leading-[0.9] text-soft-white sm:text-8xl">
                  Client galleries.
                </h1>
              </div>
              <p className="max-w-2xl text-base leading-7 text-soft-white/62 lg:justify-self-end">
                A selection of recent work. Private galleries are shared by direct link.
              </p>
            </div>
          </Reveal>

          {galleries.length === 0 ? (
            <div className="mt-16 rounded-[2px] border border-soft-white/12 bg-soft-white/4 px-6 py-20 text-center">
              <p className="font-serif text-3xl text-soft-white">No public galleries yet.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-soft-white/58">
                Check back soon, or reach out if you were sent a private gallery link.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {galleries.map((gallery, index) => (
                <Reveal key={gallery.slug} delay={(index % 3) * 0.04}>
                  <Link href={`/galleries/${gallery.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-soft-white/8">
                      <Image
                        src={gallery.imageUrl}
                        alt={gallery.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        priority={index < 3}
                        unoptimized={gallery.imageUrl.startsWith("http")}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      {gallery.hasPassword ? (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-soft-white/20 bg-ink/45 px-2.5 py-1 text-[11px] text-soft-white/80 backdrop-blur">
                          <LockKeyhole className="size-3" aria-hidden="true" />
                          Private
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <h2 className="font-serif text-2xl leading-tight text-soft-white">
                        {gallery.title}
                      </h2>
                      <p className="mt-1 text-sm text-soft-white/58">
                        {gallery.date ? formatDisplayDate(gallery.date) : "Date to be announced"}
                        {gallery.location ? ` · ${gallery.location}` : ""}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </section>
        <InquiryCallout tone="dark" />
      </main>
      <SiteFooter />
    </div>
  );
}
