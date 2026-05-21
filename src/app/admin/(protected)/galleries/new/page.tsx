import Link from "next/link";
import { GalleryForm } from "@/components/gallery-form";

export default function NewGalleryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/galleries" className="text-sm text-[#17130f]/58 hover:text-[#17130f]">
        Back to galleries
      </Link>
      <div className="mt-6">
        <p className="text-sm font-medium text-[#9b744f]">New gallery</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create gallery</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
          This creates the gallery cover record now. R2 uploads and real photo management are reserved for Phase 3B.
        </p>
      </div>
      <div className="mt-8">
        <GalleryForm />
      </div>
    </div>
  );
}

