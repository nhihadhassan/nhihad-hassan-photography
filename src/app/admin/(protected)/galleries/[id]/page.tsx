import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Heart, Images } from "lucide-react";
import { GalleryForm } from "@/components/gallery-form";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery } from "@/lib/admin-data";

type EditGalleryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGalleryPage({ params }: EditGalleryPageProps) {
  const { id } = await params;
  await requireAdmin();

  const gallery = await getAdminGallery(id);

  if (!gallery) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/galleries" className="text-sm text-[#17130f]/58 hover:text-[#17130f]">
        Back to galleries
      </Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#9b744f]">Edit gallery</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{gallery.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <Link
              href={`/admin/galleries/${gallery.id}/photos`}
              className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-[#17130f]/72 hover:bg-[#17130f] hover:text-[#fbf8f1]"
            >
              <Images className="size-3.5" aria-hidden="true" />
              Manage photos
            </Link>
            <Link
              href={`/admin/galleries/${gallery.id}/favorites`}
              className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-[#17130f]/72 hover:bg-[#17130f] hover:text-[#fbf8f1]"
            >
              <Heart className="size-3.5" aria-hidden="true" />
              Client selects
            </Link>
            <a
              href={`/galleries/${gallery.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-[#17130f]/58 hover:text-[#17130f]"
            >
              Open public cover
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
        <GalleryRowActions
          id={gallery.id}
          title={gallery.title}
          isPublished={gallery.is_published}
          isArchived={gallery.is_archived}
        />
      </div>
      <div className="mt-8">
        <GalleryForm gallery={gallery} />
      </div>
    </div>
  );
}
