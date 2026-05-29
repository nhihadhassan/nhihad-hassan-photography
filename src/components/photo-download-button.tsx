"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  photoId: string;
  className?: string;
};

export function PhotoDownloadButton({ slug, photoId, className }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    // The browser handles the file download via Content-Disposition, so the
    // page stays put. Show a brief working state for feedback.
    setSubmitting(true);
    window.setTimeout(() => setSubmitting(false), 4000);
  };

  return (
    <form
      action={`/api/galleries/${encodeURIComponent(slug)}/download`}
      method="POST"
      onSubmit={onSubmit}
      className="inline-flex"
    >
      <input type="hidden" name="scope" value="single" />
      <input type="hidden" name="photo_ids" value={photoId} />
      <button
        type="submit"
        disabled={submitting}
        aria-label="Download this photo"
        title="Download this photo"
        className={cn(
          "flex size-11 items-center justify-center rounded-full border border-soft-white/12 bg-ink/55 text-soft-white backdrop-blur transition hover:border-soft-white/30 hover:bg-soft-white hover:text-ink disabled:cursor-wait disabled:opacity-60",
          className,
        )}
      >
        {submitting ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-5" aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
