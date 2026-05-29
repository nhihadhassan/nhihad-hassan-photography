import { redirect } from "next/navigation";

type GalleryViewPageProps = {
  params: Promise<{ slug: string }>;
};

// The cover and gallery now live on a single scrollable page.
// Keep this route working by sending it to the gallery anchor.
export default async function GalleryViewPage({ params }: GalleryViewPageProps) {
  const { slug } = await params;
  redirect(`/galleries/${slug}#gallery`);
}
