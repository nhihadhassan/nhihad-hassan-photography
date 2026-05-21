import type { Metadata } from "next";
import { GalleryCover } from "@/components/gallery-cover";
import { GalleryUnavailable } from "@/components/gallery-unavailable";
import { getPublishedGalleryBySlug } from "@/lib/public-gallery";
import { mockClientGalleries } from "@/data/photography";

type GalleryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return mockClientGalleries.map((gallery) => ({ slug: gallery.slug }));
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getPublishedGalleryBySlug(slug);

  if (!gallery) {
    return {};
  }

  return {
    title: gallery.title,
    description: gallery.description,
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  const gallery = await getPublishedGalleryBySlug(slug);

  if (!gallery) {
    return <GalleryUnavailable />;
  }

  return <GalleryCover gallery={gallery} />;
}
