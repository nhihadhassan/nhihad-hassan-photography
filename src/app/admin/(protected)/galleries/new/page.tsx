import Link from "next/link";
import { NewGalleryWithPresets } from "@/components/new-gallery-with-presets";

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
          Choose a preset to pre-fill common settings, or start blank and configure everything manually.
        </p>
      </div>
      <div className="mt-8">
        <NewGalleryWithPresets />
      </div>
    </div>
  );
}

