"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  CalendarPlus,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  MessageSquareText,
  PenLine,
  Trash2,
} from "lucide-react";
import {
  deleteGallery,
  toggleGalleryArchived,
  toggleGalleryPublished,
} from "@/app/admin/(protected)/galleries/actions";
import { createGalleryReviewRequestAction } from "@/app/admin/(protected)/reviews/actions";
import { createGalleryAgreementRequestAction } from "@/app/admin/(protected)/agreements/actions";
import { createGalleryBookingAction } from "@/app/admin/(protected)/bookings/actions";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);
  const [agreementCopied, setAgreementCopied] = useState(false);
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

  const copyReviewRequest = () => {
    startTransition(async () => {
      const result = await createGalleryReviewRequestAction(id);
      if (result.reviewUrl) {
        try {
          await navigator.clipboard.writeText(result.reviewUrl);
          setReviewCopied(true);
          setTimeout(() => setReviewCopied(false), 2500);
        } catch {
          window.alert(`Review request link created: ${result.reviewUrl}`);
        }
        setOpen(false);
        return;
      }

      window.alert(result.message ?? "Could not create a review request link.");
    });
  };

  const copyAgreementRequest = () => {
    startTransition(async () => {
      const result = await createGalleryAgreementRequestAction(id);
      if (result.signUrl) {
        try {
          await navigator.clipboard.writeText(result.signUrl);
          setAgreementCopied(true);
          setTimeout(() => setAgreementCopied(false), 2500);
        } catch {
          window.alert(`Signing link created: ${result.signUrl}`);
        }
        setOpen(false);
        return;
      }

      window.alert(result.message ?? "Could not create a signing link.");
    });
  };

  const createBooking = () => {
    startTransition(async () => {
      const result = await createGalleryBookingAction(id);
      if (result.ok && result.id) {
        setOpen(false);
        router.push(`/admin/bookings/${result.id}`);
        return;
      }
      window.alert(result.message ?? "Could not create a booking.");
    });
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
            ? "border border-admin-ink/15 bg-admin-ink/6 text-admin-ink/70 hover:bg-admin-ink/12"
            : "bg-admin-ink text-admin-surface hover:bg-[#2a2218]")
        }
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>

      {/* More dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-sm text-admin-ink/65 transition hover:bg-admin-ink/6"
        >
          More
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>

        {open && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

            <div className="absolute right-0 top-full z-20 mt-1.5 min-w-52 overflow-hidden rounded-md border border-admin-ink/10 bg-white shadow-lg">
              {/* Copy gallery link */}
              <button
                type="button"
                onClick={copyLink}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-ink hover:bg-admin-surface"
              >
                {copied ? (
                  <Check className="size-4 shrink-0 text-admin-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                )}
                {copied ? "Copied!" : "Copy gallery link"}
              </button>

              {/* View in new tab */}
              <a
                href={`/galleries/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-ink hover:bg-admin-surface"
              >
                <ExternalLink className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                View public gallery
              </a>

              <button
                type="button"
                disabled={pending}
                onClick={copyReviewRequest}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-ink hover:bg-admin-surface disabled:opacity-50"
              >
                {reviewCopied ? (
                  <Check className="size-4 shrink-0 text-admin-success" aria-hidden="true" />
                ) : (
                  <MessageSquareText className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                )}
                {reviewCopied ? "Review link copied" : "Copy review request"}
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={copyAgreementRequest}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-ink hover:bg-admin-surface disabled:opacity-50"
              >
                {agreementCopied ? (
                  <Check className="size-4 shrink-0 text-admin-success" aria-hidden="true" />
                ) : (
                  <PenLine className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                )}
                {agreementCopied ? "Signing link copied" : "Copy agreement to sign"}
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={createBooking}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-ink hover:bg-admin-surface disabled:opacity-50"
              >
                <CalendarPlus className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                Create booking hub
              </button>

              <div className="my-1 border-t border-admin-ink/8" />

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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-ink hover:bg-admin-surface disabled:opacity-50"
              >
                {isArchived ? (
                  <ArchiveRestore className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                ) : (
                  <Archive className="size-4 shrink-0 text-admin-ink/45" aria-hidden="true" />
                )}
                {isArchived ? "Unarchive" : "Archive"}
              </button>

              <div className="my-1 border-t border-admin-ink/8" />

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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
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
