import Link from "next/link";
import { NewCollectionForm } from "@/components/new-collection-form";

export default function NewGalleryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/galleries" className="text-sm text-admin-ink/65 hover:text-admin-ink">
        Back to galleries
      </Link>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">New collection</h1>
        <p className="mt-2 text-sm leading-6 text-admin-ink/60">
          Just the essentials to get started. Add photos and fine-tune settings next.
        </p>
      </div>
      <div className="mt-6">
        <NewCollectionForm />
      </div>
    </div>
  );
}
