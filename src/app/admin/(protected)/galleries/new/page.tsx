import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCollectionForm } from "@/components/new-collection-form";
import { requireAdmin } from "@/lib/auth";
import { getRecentGalleryLocations } from "@/lib/admin-data";
import { getClientList } from "@/lib/clients";

export default async function NewGalleryPage() {
  await requireAdmin();

  const [locations, clients] = await Promise.all([getRecentGalleryLocations(), getClientList()]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/galleries"
        className="inline-flex items-center gap-1.5 text-sm text-admin-ink/65 transition hover:text-admin-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All collections
      </Link>
      <div className="mt-5">
        <p className="text-sm font-medium text-admin-accent">New collection</p>
        <h1 className="admin-display mt-1 text-3xl">Start a collection</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-admin-muted">
          Just the essentials to get started — a title, who it&apos;s for, and a shoot type. You&apos;ll
          land on the upload screen next; privacy, downloads, and passwords live on Settings.
        </p>
      </div>
      <div className="mt-7">
        <NewCollectionForm locations={locations} clients={clients} />
      </div>
    </div>
  );
}
