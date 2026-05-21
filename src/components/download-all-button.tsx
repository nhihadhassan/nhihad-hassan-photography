"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  photoCount: number;
  className?: string;
};

export function DownloadAllButton({ slug, photoCount, className }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    // The browser handles the file download via Content-Disposition. We just
    // show a brief "Preparing…" state so the visitor knows it's working —
    // the page itself stays put.
    setSubmitting(true);
    window.setTimeout(() => setSubmitting(false), 4000);
  };

  return (
    <form
      action={`/api/galleries/${encodeURIComponent(slug)}/download`}
      method="POST"
      onSubmit={onSubmit}
      className={cn("inline-flex", className)}
    >
      <input type="hidden" name="scope" value="all" />
      <button
        type="submit"
        disabled={submitting}
        title={`Download all ${photoCount} photos as a ZIP`}
        className={cn(
          "inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/12 px-3 text-sm text-ink/68 transition hover:bg-ink hover:text-soft-white disabled:cursor-wait disabled:opacity-60",
        )}
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {submitting ? "Preparing…" : `Download all (${photoCount})`}
      </button>
    </form>
  );
}
