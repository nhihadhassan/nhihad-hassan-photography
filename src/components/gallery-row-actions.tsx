"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  deleteGallery,
  toggleGalleryArchived,
  toggleGalleryPublished,
} from "@/app/admin/(protected)/galleries/actions";

export function GalleryRowActions({
  id,
  title,
  isPublished,
  isArchived,
}: {
  id: string;
  title: string;
  isPublished: boolean;
  isArchived: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={pending}
        onClick={() => {
          const data = new FormData();
          data.set("id", id);
          data.set("next", String(!isPublished));
          startTransition(() => toggleGalleryPublished(data));
        }}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#17130f]/10 px-3 text-xs text-[#17130f]/68 transition hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:opacity-45"
      >
        {isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          const data = new FormData();
          data.set("id", id);
          data.set("next", String(!isArchived));
          startTransition(() => toggleGalleryArchived(data));
        }}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#17130f]/10 px-3 text-xs text-[#17130f]/68 transition hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:opacity-45"
      >
        {isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
        {isArchived ? "Unarchive" : "Archive"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
            return;
          }

          const data = new FormData();
          data.set("id", id);
          startTransition(() => deleteGallery(data));
        }}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#8a2f24]/20 px-3 text-xs text-[#8a2f24] transition hover:bg-[#8a2f24] hover:text-[#fbf8f1] disabled:opacity-45"
      >
        <Trash2 className="size-3.5" />
        Delete
      </button>
    </div>
  );
}

