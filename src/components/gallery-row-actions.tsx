"use client";

import { useRef, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Check, ChevronDown, Copy, ExternalLink, Trash2 } from "lucide-react";
import {
  deleteGallery,
  toggleGalleryArchived,
  toggleGalleryPublished,
} from "@/app/admin/(protected)/galleries/actions";

export function GalleryRowActions({
  id,
  title,
  slug,
  isPublished,
  isArchived,
}: {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isArchived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/galleries/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Primary CTA: Publish / Unpublish */}
      <button
        disabled={pending}
        onClick={() => {
          const data = new FormData();
          data.set("id", id);
          data.set("next", String(!isPublished));
          startTransition(() => toggleGalleryPublished(data));
        }}
        className={
          "inline-flex min-h-9 items-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:opacity-45 " +
          (isPublished
            ? "border border-[#17130f]/15 bg-[#17130f]/6 text-[#17130f]/70 hover:bg-[#17130f]/12"
            : "bg-[#17130f] text-[#fbf8f1] hover:bg-[#2a2218]")
        }
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>

      {/* More dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#17130f]/12 px-3 text-sm text-[#17130f]/65 transition hover:bg-[#17130f]/6"
        >
          More
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>

        {open && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

            <div className="absolute right-0 top-full z-20 mt-1.5 min-w-52 overflow-hidden rounded-md border border-[#17130f]/10 bg-white shadow-lg">
              {/* Copy gallery link */}
              <button
                type="button"
                onClick={copyLink}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#17130f] hover:bg-[#fbf8f1]"
              >
                {copied ? (
                  <Check className="size-4 shrink-0 text-[#3f6e4a]" aria-hidden="true" />
                ) : (
                  <Copy className="size-4 shrink-0 text-[#17130f]/45" aria-hidden="true" />
                )}
                {copied ? "Copied!" : "Copy gallery link"}
              </button>

              {/* View in new tab */}
              <a
                href={`/galleries/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#17130f] hover:bg-[#fbf8f1]"
              >
                <ExternalLink className="size-4 shrink-0 text-[#17130f]/45" aria-hidden="true" />
                View public gallery
              </a>

              <div className="my-1 border-t border-[#17130f]/8" />

              {/* Archive / Unarchive */}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const data = new FormData();
                  data.set("id", id);
                  data.set("next", String(!isArchived));
                  setOpen(false);
                  startTransition(() => toggleGalleryArchived(data));
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#17130f] hover:bg-[#fbf8f1] disabled:opacity-50"
              >
                {isArchived ? (
                  <ArchiveRestore className="size-4 shrink-0 text-[#17130f]/45" aria-hidden="true" />
                ) : (
                  <Archive className="size-4 shrink-0 text-[#17130f]/45" aria-hidden="true" />
                )}
                {isArchived ? "Unarchive" : "Archive"}
              </button>

              <div className="my-1 border-t border-[#17130f]/8" />

              {/* Delete collection */}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
                  const data = new FormData();
                  data.set("id", id);
                  setOpen(false);
                  startTransition(() => deleteGallery(data));
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#8a2f24] hover:bg-[#8a2f24]/8 disabled:opacity-50"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                Delete collection
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
