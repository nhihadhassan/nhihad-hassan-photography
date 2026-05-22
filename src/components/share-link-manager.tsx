"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Copy, ExternalLink, Link2Off, Loader2 } from "lucide-react";
import type { PhotoWithUrls } from "@/lib/photos";
import type { ShareLink } from "@/lib/share-links";
import {
  createShareLinkAction,
  revokeShareLinkAction,
  type ShareLinkActionState,
} from "@/app/admin/(protected)/galleries/[id]/share/actions";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

// ── Copy button ────────────────────────────────────────────────────────────

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the input
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#17130f]/12 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#17130f] transition hover:border-[#17130f]/25 hover:bg-white"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-green-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}

// ── Revoke button ──────────────────────────────────────────────────────────

function RevokeButton({ id, onRevoked }: { id: string; onRevoked: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRevoke() {
    if (!confirm("Revoke this share link? Anyone with the URL will lose access.")) return;
    startTransition(async () => {
      const result = await revokeShareLinkAction(id);
      if (result.ok) {
        onRevoked();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRevoke}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#8a2f24]/20 bg-[#8a2f24]/6 px-3 py-1.5 text-xs font-medium text-[#8a2f24] transition hover:bg-[#8a2f24]/12 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Link2Off className="size-3.5" />
        )}
        Revoke
      </button>
      {error ? <p className="mt-1 text-xs text-[#8a2f24]">{error}</p> : null}
    </div>
  );
}

// ── Existing share links list ──────────────────────────────────────────────

type ShareLinkRowProps = {
  link: ShareLink;
  siteOrigin: string;
  onRevoked: (id: string) => void;
};

function ShareLinkRow({ link, siteOrigin, onRevoked }: ShareLinkRowProps) {
  const url = `${siteOrigin}/share/${link.token}`;
  const expired = isExpired(link.expires_at);
  const revoked = Boolean(link.revoked_at);
  const inactive = expired || revoked;

  return (
    <div
      className={[
        "rounded-md border p-4",
        inactive
          ? "border-[#17130f]/8 bg-[#17130f]/3 opacity-60"
          : "border-[#17130f]/10 bg-white/50",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[#17130f]">{link.title}</p>
            {revoked ? (
              <span className="rounded-full bg-[#8a2f24]/12 px-2 py-0.5 text-xs text-[#8a2f24]">
                Revoked
              </span>
            ) : expired ? (
              <span className="rounded-full bg-[#17130f]/10 px-2 py-0.5 text-xs text-[#17130f]/55">
                Expired
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                Active
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#17130f]/50">
            {link.recipient_label ? <span>For: {link.recipient_label}</span> : null}
            <span>{link.photo_count} photo{link.photo_count === 1 ? "" : "s"}</span>
            <span>Created {formatDate(link.created_at)}</span>
            {link.expires_at ? (
              <span>Expires {formatDate(link.expires_at)}</span>
            ) : null}
          </div>
          <p className="mt-1.5 truncate font-mono text-xs text-[#17130f]/35">{url}</p>
        </div>

        {!inactive ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#17130f]/12 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#17130f] transition hover:border-[#17130f]/25 hover:bg-white"
            >
              <ExternalLink className="size-3.5" />
              Open
            </a>
            <CopyButton url={url} />
            <RevokeButton id={link.id} onRevoked={() => onRevoked(link.id)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Photo picker ───────────────────────────────────────────────────────────

type PhotoPickerProps = {
  photos: PhotoWithUrls[];
  selected: Set<string>;
  onToggle: (id: string) => void;
};

function PhotoPicker({ photos, selected, onToggle }: PhotoPickerProps) {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-[#17130f]/50">
        No photos uploaded yet. Add photos in the Photos tab first.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {photos.map((photo) => {
        const isSelected = selected.has(photo.id);
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onToggle(photo.id)}
            className={[
              "group relative aspect-square overflow-hidden rounded-md border-2 transition",
              isSelected
                ? "border-[#9b744f] ring-1 ring-[#9b744f]/50"
                : "border-transparent hover:border-[#17130f]/20",
            ].join(" ")}
          >
            {photo.thumbnail_url ? (
              <Image
                src={photo.thumbnail_url}
                alt={photo.filename}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 120px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#17130f]/8 text-xs text-[#17130f]/40">
                {photo.filename}
              </div>
            )}
            {isSelected ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#9b744f]/25">
                <div className="flex size-6 items-center justify-center rounded-full bg-[#9b744f]">
                  <Check className="size-3.5 text-white" />
                </div>
              </div>
            ) : null}
            {photo.is_hidden ? (
              <div className="absolute inset-x-0 bottom-0 bg-[#17130f]/60 px-1 py-0.5 text-center text-xs text-white/70">
                hidden
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const initialState: ShareLinkActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-10 rounded-md border border-[#17130f]/10 bg-white/70 px-3 text-sm text-[#17130f] outline-none transition placeholder:text-[#17130f]/35 focus:border-[#b98257]";

type ShareLinkManagerProps = {
  galleryId: string;
  photos: PhotoWithUrls[];
  initialLinks: ShareLink[];
  siteOrigin: string;
};

export function ShareLinkManager({
  galleryId,
  photos,
  initialLinks,
  siteOrigin,
}: ShareLinkManagerProps) {
  const [state, formAction, pending] = useActionState(createShareLinkAction, initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [links, setLinks] = useState<ShareLink[]>(initialLinks);

  function togglePhoto(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(photos.filter((p) => !p.is_hidden).map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleRevoked(id: string) {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, revoked_at: new Date().toISOString() } : l,
      ),
    );
  }

  const visibleCount = photos.filter((p) => !p.is_hidden).length;

  return (
    <div className="grid gap-8">
      {/* Create new share link */}
      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Create share link</h2>
        <p className="mt-1 text-sm leading-6 text-[#17130f]/58">
          Select photos to include, add a title and optional recipient label, then generate a
          link you can send to vendors, planners, or partners.
        </p>

        <form action={formAction} className="mt-5 grid gap-5">
          <input type="hidden" name="gallery_id" value={galleryId} />

          {/* Selected photo ids — one hidden input per selection */}
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="photo_ids" value={id} />
          ))}

          {/* Photo picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                Photos
                {selected.size > 0 ? (
                  <span className="ml-2 text-[#9b744f]">({selected.size} selected)</span>
                ) : null}
              </span>
              <div className="flex gap-3 text-xs text-[#17130f]/55">
                {visibleCount > 0 ? (
                  <>
                    <button type="button" onClick={selectAll} className="hover:text-[#17130f]">
                      Select all
                    </button>
                    <button type="button" onClick={clearAll} className="hover:text-[#17130f]">
                      Clear
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <PhotoPicker photos={photos} selected={selected} onToggle={togglePhoto} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Title</span>
              <input
                className={inputClass}
                name="title"
                placeholder="Florist selects · June 2026"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Recipient label <span className="text-[#17130f]/40">(optional)</span></span>
              <input
                className={inputClass}
                name="recipient_label"
                placeholder="Blooms & Co."
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Expiry <span className="text-[#17130f]/40">(optional)</span></span>
              <input className={inputClass} name="expires_at" type="datetime-local" />
            </label>
          </div>

          {state.message && state.status !== "success" ? (
            <p className="rounded-md bg-[#8a2f24]/10 px-4 py-3 text-sm text-[#7a2e25]">
              {state.message}
            </p>
          ) : null}

          {state.status === "success" && state.shareUrl ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">Share link created!</p>
              <p className="mt-1 break-all font-mono text-xs text-emerald-700">{state.shareUrl}</p>
              <div className="mt-3">
                <CopyButton url={state.shareUrl} />
              </div>
            </div>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={pending || selected.size === 0}
              className="inline-flex items-center gap-2 rounded-md bg-[#17130f] px-5 py-2.5 text-sm font-medium text-[#fbf8f1] transition hover:bg-[#17130f]/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Creating…" : "Create share link"}
            </button>
          </div>
        </form>
      </section>

      {/* Existing share links */}
      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Existing links
          {links.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-[#17130f]/45">
              ({links.length})
            </span>
          ) : null}
        </h2>

        {links.length === 0 ? (
          <p className="mt-3 text-sm text-[#17130f]/50">No share links yet for this gallery.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {links.map((link) => (
              <ShareLinkRow
                key={link.id}
                link={link}
                siteOrigin={siteOrigin}
                onRevoked={handleRevoked}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
