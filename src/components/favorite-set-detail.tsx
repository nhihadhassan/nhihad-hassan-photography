"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Clipboard, Download, ImageOff, Mail } from "lucide-react";
import type { FavoriteSetDetail } from "@/lib/favorites";

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function FavoriteSetDetailCard({
  detail,
  galleryTitle,
}: {
  detail: FavoriteSetDetail;
  galleryTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  const filenames = detail.photos.map((p) => p.filename);
  const filenamesText = filenames.join("\n");

  const copyFilenames = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(filenamesText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = filenamesText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // silent
    }
  };

  const downloadCsv = () => {
    const rows = [
      ["filename", "photo_id"],
      ...detail.photos.map((p) => [p.filename, p.id]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = galleryTitle.replace(/[^a-z0-9\-_ ]/gi, "").slice(0, 60).trim() || "gallery";
    const visitor = (detail.visitor_email || detail.visitor_name || "visitor").replace(
      /[^a-z0-9\-_@.]/gi,
      "",
    );
    a.href = url;
    a.download = `${safeTitle} - ${visitor} - selects.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {detail.visitor_name || detail.visitor_email || "Anonymous visitor"}
          </h2>
          {detail.visitor_email ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#17130f]/68">
              <Mail className="size-3.5" aria-hidden="true" />
              <a
                href={`mailto:${detail.visitor_email}`}
                className="hover:text-[#17130f] hover:underline"
              >
                {detail.visitor_email}
              </a>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[#17130f]/55">
            Submitted {formatTime(detail.submitted_at ?? detail.created_at)} ·{" "}
            {detail.photo_count} photo{detail.photo_count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyFilenames}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#17130f]/12 px-3 text-xs text-[#17130f]/68 transition hover:bg-[#17130f] hover:text-[#fbf8f1]"
          >
            {copied ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                Copied filenames
              </>
            ) : (
              <>
                <Clipboard className="size-3.5" aria-hidden="true" />
                Copy filenames
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#17130f]/12 px-3 text-xs text-[#17130f]/68 transition hover:bg-[#17130f] hover:text-[#fbf8f1]"
          >
            <Download className="size-3.5" aria-hidden="true" />
            CSV
          </button>
        </div>
      </div>

      {detail.notes ? (
        <div className="mt-5 rounded-md border border-[#17130f]/10 bg-white/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#17130f]/50">
            Notes from visitor
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#17130f]/85">{detail.notes}</p>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-medium text-[#17130f]/68">Selected photos</h3>
        {detail.photos.length === 0 ? (
          <p className="mt-2 text-sm text-[#17130f]/45">
            The original photos for this submission have been deleted from the gallery.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {detail.photos.map((photo) => {
              const aspect = photo.width && photo.height ? photo.width / photo.height : 1;
              return (
                <li
                  key={photo.id}
                  className="overflow-hidden rounded-sm border border-[#17130f]/10 bg-[#17130f]/5"
                >
                  <div className="relative" style={{ aspectRatio: aspect || 1 }}>
                    {photo.thumbnail_url ? (
                      <Image
                        src={photo.thumbnail_url}
                        alt={photo.filename}
                        fill
                        sizes="(min-width: 1024px) 18vw, (min-width: 640px) 25vw, 33vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[#17130f]/35">
                        <ImageOff className="size-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <p
                    className="truncate px-2 py-1.5 text-[10px] text-[#17130f]/55"
                    title={photo.filename}
                  >
                    {photo.filename}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
