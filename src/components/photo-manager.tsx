"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  ImageOff,
  Loader2,
  Sparkles,
  Square,
  Star,
  StarOff,
  Trash2,
  TriangleAlert,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react";
import type { PhotoWithUrls } from "@/lib/photos";
import {
  clearGalleryCover,
  deletePhoto,
  deletePhotos,
  movePhoto,
  setGalleryCover,
  togglePhotoHidden,
} from "@/app/admin/(protected)/galleries/[id]/photos/actions";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

type UploadItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

type BackfillStatus = "pending" | "running" | "done" | "error";
type BackfillState = { status: BackfillStatus; error?: string };

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Three-step upload that bypasses Vercel's request body size limit:
 *   1. POST /api/admin/photos/presign  → get a presigned R2 PUT URL (tiny JSON payload)
 *   2. PUT  <presigned R2 URL>         → upload file directly to R2 (skips Vercel entirely)
 *   3. POST /api/admin/photos/process  → server downloads from R2, runs Sharp, inserts DB row
 *
 * Progress is reported in three phases:
 *   0–5 %   presigning
 *   5–85 %  direct upload to R2 (XHR progress events)
 *   85–100% Sharp processing on the server
 */
async function uploadWithProgress({
  file,
  galleryId,
  width,
  height,
  onProgress,
}: {
  file: File;
  galleryId: string;
  width: number | null;
  height: number | null;
  onProgress: (pct: number) => void;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // ── Step 1: presign ────────────────────────────────────────────────────────
  onProgress(2);
  let presignData: {
    presigned_url: string;
    original_key: string;
    gallery_id: string;
    filename: string;
    content_type: string;
    size: number;
    width: number | null;
    height: number | null;
  };
  try {
    const res = await fetch("/api/admin/photos/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gallery_id: galleryId,
        filename: file.name,
        content_type: file.type,
        size: file.size,
        width,
        height,
      }),
    });
    if (!res.ok) {
      let message = `Presign failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch { /* ignore */ }
      return { ok: false, error: message };
    }
    presignData = (await res.json()) as typeof presignData;
  } catch {
    return { ok: false, error: "Network error (presign)." };
  }

  // ── Step 2: direct PUT to R2 ───────────────────────────────────────────────
  const uploadResult = await new Promise<{ ok: true } | { ok: false; error: string }>(
    (resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignData.presigned_url);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Map 0→100% upload progress into the 5–85% overall range.
          const pct = 5 + Math.round((event.loaded / event.total) * 80);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: `Direct upload failed (${xhr.status}).` });
        }
      };

      xhr.onerror = () => resolve({ ok: false, error: "Network error (direct upload)." });
      xhr.send(file);
    },
  );

  if (!uploadResult.ok) return uploadResult;
  onProgress(87);

  // ── Step 3: process (Sharp + DB insert) ───────────────────────────────────
  try {
    const res = await fetch("/api/admin/photos/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gallery_id: presignData.gallery_id,
        original_key: presignData.original_key,
        filename: presignData.filename,
        content_type: presignData.content_type,
        size: presignData.size,
        width: presignData.width,
        height: presignData.height,
      }),
    });
    if (!res.ok) {
      let message = `Processing failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch { /* ignore */ }
      return { ok: false, error: message };
    }
  } catch {
    return { ok: false, error: "Network error (processing)." };
  }

  onProgress(100);
  return { ok: true };
}

export function PhotoManager({
  galleryId,
  slug,
  coverPhotoId,
  initialPhotos,
}: {
  galleryId: string;
  slug: string;
  coverPhotoId: string | null;
  initialPhotos: PhotoWithUrls[];
}) {
  void slug;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [backfillStates, setBackfillStates] = useState<Record<string, BackfillState>>({});
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = initialPhotos;
  const activeUploads = uploads.filter((u) => u.status === "uploading" || u.status === "pending");
  const completedUploads = uploads.filter((u) => u.status === "success");
  const erroredUploads = uploads.filter((u) => u.status === "error");

  const missingVariantPhotos = useMemo(
    () => photos.filter((p) => !p.web_key || !p.thumbnail_key),
    [photos],
  );

  const runBackfill = useCallback(async () => {
    if (backfillRunning || missingVariantPhotos.length === 0) return;
    setBackfillRunning(true);

    const initial: Record<string, BackfillState> = {};
    for (const p of missingVariantPhotos) initial[p.id] = { status: "pending" };
    setBackfillStates((prev) => ({ ...prev, ...initial }));

    for (const photo of missingVariantPhotos) {
      setBackfillStates((prev) => ({ ...prev, [photo.id]: { status: "running" } }));
      try {
        const res = await fetch(`/api/admin/photos/${photo.id}/backfill-variants`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setBackfillStates((prev) => ({
            ...prev,
            [photo.id]: { status: "error", error: body.error ?? `HTTP ${res.status}` },
          }));
          continue;
        }
        setBackfillStates((prev) => ({ ...prev, [photo.id]: { status: "done" } }));
      } catch (error) {
        setBackfillStates((prev) => ({
          ...prev,
          [photo.id]: {
            status: "error",
            error: error instanceof Error ? error.message : "Network error.",
          },
        }));
      }
    }

    setBackfillRunning(false);
    router.refresh();
  }, [backfillRunning, missingVariantPhotos, router]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }, [photos]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Permanently delete ${ids.length} photo${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await deletePhotos(ids, galleryId);
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
      router.refresh();
    }
  }, [selectedIds, galleryId, router]);

  const handleFiles = useCallback(
    async (filesList: FileList | File[]) => {
      const files = Array.from(filesList);
      if (!files.length) return;

      const validated: UploadItem[] = [];
      for (const file of files) {
        const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;

        if (!ALLOWED_TYPES.has(file.type)) {
          validated.push({
            id,
            file,
            status: "error",
            progress: 0,
            error: `Unsupported type: ${file.type || "unknown"}.`,
          });
          continue;
        }

        if (file.size > MAX_BYTES) {
          validated.push({
            id,
            file,
            status: "error",
            progress: 0,
            error: `Too large (${formatBytes(file.size)}). Max 50 MB.`,
          });
          continue;
        }

        validated.push({ id, file, status: "pending", progress: 0 });
      }

      setUploads((prev) => [...prev, ...validated]);

      for (const item of validated) {
        if (item.status === "error") continue;
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: "uploading" } : u)),
        );
        const dims = await readImageDimensions(item.file);
        const result = await uploadWithProgress({
          file: item.file,
          galleryId,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          onProgress: (pct) => {
            setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u)));
          },
        });
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? result.ok
                ? { ...u, status: "success", progress: 100 }
                : { ...u, status: "error", error: result.error }
              : u,
          ),
        );
      }

      router.refresh();
    },
    [galleryId, router],
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files);
    }
  };

  const clearFinished = () => {
    setUploads((prev) => prev.filter((u) => u.status !== "success"));
  };

  const dismissErrors = () => {
    setUploads((prev) => prev.filter((u) => u.status !== "error"));
  };

  const runAction = (form: FormData, action: (data: FormData) => Promise<void>) => {
    startTransition(async () => {
      await action(form);
      router.refresh();
    });
  };

  const photoListItems = useMemo(
    () =>
      photos.map((photo, index) => ({
        photo,
        index,
        isFirst: index === 0,
        isLast: index === photos.length - 1,
        isCover: photo.id === coverPhotoId,
      })),
    [photos, coverPhotoId],
  );

  return (
    <div className="space-y-8">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.target === e.currentTarget) setIsDragging(false);
        }}
        onDrop={onDrop}
        className={
          "relative rounded-md border-2 border-dashed bg-[#fbf8f1] p-8 text-center transition " +
          (isDragging
            ? "border-[#9b744f] bg-[#b98257]/10"
            : "border-[#17130f]/15 hover:border-[#17130f]/30")
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#17130f]/8 text-[#17130f]">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <p className="text-base font-medium text-[#17130f]">
            Drop photos here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#9b744f] underline decoration-[#9b744f]/40 underline-offset-4 hover:decoration-[#9b744f]"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-[#17130f]/55">
            JPG, PNG, or WebP · up to 50 MB each · multi-select supported
          </p>
        </div>
      </div>

      {(activeUploads.length > 0 || completedUploads.length > 0 || erroredUploads.length > 0) && (
        <div className="rounded-md border border-[#17130f]/10 bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#17130f]">
              Uploads — {completedUploads.length} done, {activeUploads.length} active,{" "}
              {erroredUploads.length} failed
            </p>
            <div className="flex gap-2">
              {completedUploads.length > 0 && activeUploads.length === 0 && (
                <button
                  type="button"
                  onClick={clearFinished}
                  className="text-xs text-[#17130f]/55 hover:text-[#17130f]"
                >
                  Clear finished
                </button>
              )}
              {erroredUploads.length > 0 && (
                <button
                  type="button"
                  onClick={dismissErrors}
                  className="text-xs text-[#8a2f24]/70 hover:text-[#8a2f24]"
                >
                  Dismiss errors
                </button>
              )}
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {uploads.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-sm border border-[#17130f]/8 bg-[#fbf8f1] px-3 py-2 text-xs"
              >
                {u.status === "uploading" || u.status === "pending" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-[#9b744f]" aria-hidden="true" />
                ) : u.status === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-[#3f6e4a]" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-[#8a2f24]" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[#17130f]">{u.file.name}</p>
                  {u.status === "error" ? (
                    <p className="text-[#8a2f24]">{u.error}</p>
                  ) : u.status === "uploading" ? (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#17130f]/10">
                      <div
                        className="h-full bg-[#9b744f] transition-all"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  ) : u.status === "success" ? (
                    <p className="text-[#17130f]/55">Uploaded · {formatBytes(u.file.size)}</p>
                  ) : (
                    <p className="text-[#17130f]/55">Queued</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#17130f]/15 bg-[#fbf8f1] p-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#17130f]/8">
            <ImageOff className="size-5 text-[#17130f]/60" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-medium text-[#17130f]">No photos yet.</p>
          <p className="mt-1 text-sm text-[#17130f]/55">
            Drop files above to upload your first photos.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Photos in this gallery
              <span className="ml-2 text-sm font-normal text-[#17130f]/45">
                {photos.length}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Select all / deselect all */}
              {selectedIds.size === 0 ? (
                <button
                  type="button"
                  onClick={selectAll}
                  className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-xs text-[#17130f]/68 hover:bg-[#17130f]/6"
                >
                  <CheckSquare className="size-3.5" aria-hidden="true" />
                  Select all
                </button>
              ) : (
                <button
                  type="button"
                  onClick={deselectAll}
                  className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-xs text-[#17130f]/68 hover:bg-[#17130f]/6"
                >
                  <Square className="size-3.5" aria-hidden="true" />
                  Deselect all
                </button>
              )}
              <button
                type="button"
                onClick={runBackfill}
                disabled={backfillRunning || missingVariantPhotos.length === 0}
                className="inline-flex items-center gap-2 rounded-md border border-[#9b744f]/40 bg-[#b98257]/15 px-3 py-1.5 text-xs font-medium text-[#9b744f] transition hover:bg-[#9b744f] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title={
                  missingVariantPhotos.length === 0
                    ? "All photos are optimized"
                    : `Generate web + thumbnail variants for ${missingVariantPhotos.length} photo(s)`
                }
              >
                {backfillRunning ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="size-3.5" aria-hidden="true" />
                )}
                {backfillRunning
                  ? "Optimizing…"
                  : `Generate missing variants (${missingVariantPhotos.length})`}
              </button>
              {coverPhotoId ? (
                <form action={(form) => runAction(form, clearGalleryCover)}>
                  <input type="hidden" name="gallery_id" value={galleryId} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-xs text-[#17130f]/68 hover:bg-[#17130f]/6"
                  >
                    <StarOff className="size-3.5" aria-hidden="true" />
                    Clear cover
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          {/* Bulk action bar — shown when photos are selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#8a2f24]/20 bg-[#8a2f24]/8 px-4 py-3">
              <p className="text-sm font-medium text-[#8a2f24]">
                {selectedIds.size} photo{selectedIds.size === 1 ? "" : "s"} selected
              </p>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-[#8a2f24] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#6e2419] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-3.5" aria-hidden="true" />
                )}
                {bulkDeleting
                  ? "Deleting…"
                  : `Delete ${selectedIds.size} photo${selectedIds.size === 1 ? "" : "s"}`}
              </button>
            </div>
          )}

          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photoListItems.map(({ photo, isFirst, isLast, isCover }) => {
              const aspect = photo.width && photo.height ? photo.width / photo.height : 1;
              return (
                <li
                  key={photo.id}
                  className={
                    "group overflow-hidden rounded-md border bg-[#fbf8f1] transition " +
                    (selectedIds.has(photo.id)
                      ? "border-[#8a2f24] shadow-[0_0_0_2px_#8a2f24]"
                      : isCover
                        ? "border-[#9b744f] shadow-[0_0_0_1px_#9b744f]"
                        : "border-[#17130f]/10")
                  }
                >
                  <div className="relative bg-[#17130f]/8" style={{ aspectRatio: aspect || 1 }}>
                    {/* Selection checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(photo.id)}
                      aria-label={selectedIds.has(photo.id) ? "Deselect photo" : "Select photo"}
                      className={
                        "absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full border-2 transition " +
                        (selectedIds.has(photo.id)
                          ? "border-[#8a2f24] bg-[#8a2f24] text-white"
                          : "border-white/70 bg-black/30 text-white opacity-0 group-hover:opacity-100 " +
                            (selectedIds.size > 0 ? "opacity-100" : ""))
                      }
                    >
                      {selectedIds.has(photo.id) ? (
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      ) : (
                        <span className="size-2.5 rounded-full" />
                      )}
                    </button>
                    {photo.display_url ? (
                      <Image
                        src={photo.thumbnail_url || photo.display_url}
                        alt={photo.filename}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className={
                          "object-cover " + (photo.is_hidden ? "opacity-50" : "")
                        }
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#17130f]/35">
                        <ImageOff className="size-6" aria-hidden="true" />
                      </div>
                    )}
                    {isCover && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#9b744f] px-2 py-0.5 text-[10px] font-medium text-white">
                        <Star className="size-3" aria-hidden="true" />
                        Cover
                      </span>
                    )}
                    {photo.is_hidden && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#17130f]/80 px-2 py-0.5 text-[10px] font-medium text-white">
                        <EyeOff className="size-3" aria-hidden="true" />
                        Hidden
                      </span>
                    )}
                    {(() => {
                      const state = backfillStates[photo.id];
                      const hasVariants = Boolean(photo.web_key && photo.thumbnail_key);
                      if (state?.status === "running") {
                        return (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#17130f]/85 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                            Optimizing
                          </span>
                        );
                      }
                      if (state?.status === "error") {
                        return (
                          <span
                            className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#8a2f24] px-2 py-0.5 text-[10px] font-medium text-white"
                            title={state.error}
                          >
                            <XCircle className="size-3" aria-hidden="true" />
                            Failed
                          </span>
                        );
                      }
                      if (hasVariants) {
                        return (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#3f6e4a]/90 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Sparkles className="size-3" aria-hidden="true" />
                            Optimized
                          </span>
                        );
                      }
                      return (
                        <span
                          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#b98257] px-2 py-0.5 text-[10px] font-medium text-white"
                          title="Web/thumbnail variants missing — click Generate missing variants"
                        >
                          <TriangleAlert className="size-3" aria-hidden="true" />
                          Original only
                        </span>
                      );
                    })()}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-xs text-[#17130f]/65" title={photo.filename}>
                      {photo.filename}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#17130f]/45">
                      {photo.width && photo.height ? `${photo.width}×${photo.height} · ` : ""}
                      {formatBytes(photo.size_bytes)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <form action={(form) => runAction(form, setGalleryCover)}>
                        <input type="hidden" name="photo_id" value={photo.id} />
                        <input type="hidden" name="gallery_id" value={galleryId} />
                        <button
                          type="submit"
                          disabled={pending || isCover}
                          title={isCover ? "Current cover" : "Set as cover"}
                          className="inline-flex items-center gap-1 rounded-md border border-[#17130f]/10 px-2 py-1 text-[10px] text-[#17130f]/65 hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Star className="size-3" aria-hidden="true" />
                          Cover
                        </button>
                      </form>

                      <form action={(form) => runAction(form, togglePhotoHidden)}>
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="gallery_id" value={galleryId} />
                        <input type="hidden" name="next" value={String(!photo.is_hidden)} />
                        <button
                          type="submit"
                          disabled={pending}
                          title={photo.is_hidden ? "Unhide" : "Hide"}
                          className="inline-flex items-center gap-1 rounded-md border border-[#17130f]/10 px-2 py-1 text-[10px] text-[#17130f]/65 hover:bg-[#17130f] hover:text-[#fbf8f1]"
                        >
                          {photo.is_hidden ? (
                            <Eye className="size-3" aria-hidden="true" />
                          ) : (
                            <EyeOff className="size-3" aria-hidden="true" />
                          )}
                          {photo.is_hidden ? "Show" : "Hide"}
                        </button>
                      </form>

                      <form action={(form) => runAction(form, movePhoto)}>
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="gallery_id" value={galleryId} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={pending || isFirst}
                          title="Move up"
                          className="inline-flex items-center gap-1 rounded-md border border-[#17130f]/10 px-2 py-1 text-[10px] text-[#17130f]/65 hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowUp className="size-3" aria-hidden="true" />
                        </button>
                      </form>

                      <form action={(form) => runAction(form, movePhoto)}>
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="gallery_id" value={galleryId} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={pending || isLast}
                          title="Move down"
                          className="inline-flex items-center gap-1 rounded-md border border-[#17130f]/10 px-2 py-1 text-[10px] text-[#17130f]/65 hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowDown className="size-3" aria-hidden="true" />
                        </button>
                      </form>

                      <form
                        action={(form) => {
                          if (!window.confirm(`Delete "${photo.filename}"?`)) return;
                          runAction(form, deletePhoto);
                        }}
                      >
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="gallery_id" value={galleryId} />
                        <button
                          type="submit"
                          disabled={pending}
                          title="Delete"
                          className="inline-flex items-center gap-1 rounded-md border border-[#8a2f24]/20 px-2 py-1 text-[10px] text-[#8a2f24] hover:bg-[#8a2f24] hover:text-[#fbf8f1] disabled:opacity-40"
                        >
                          <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
