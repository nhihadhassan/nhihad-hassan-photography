"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpDown,
  ArrowUpToLine,
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  Film,
  Grid2X2,
  Grid3X3,
  ImageOff,
  Loader2,
  Play,
  Save,
  Shuffle,
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
  setGalleryCover,
  togglePhotoHidden,
} from "@/app/admin/(protected)/galleries/[id]/photos/actions";

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime"]);
// .mov almost always decodes fine enough for <video> metadata (duration,
// dimensions) even in browsers that can't play its HEVC frames, so it stays
// in the accepted-types set — just excluded from PREVIEWABLE_VIDEO_TYPES
// below, which is what actually decides whether the gallery attempts inline
// playback versus showing a download-only card.
const ALLOWED_TYPES = new Set([...IMAGE_TYPES, ...VIDEO_TYPES]);
const PREVIEWABLE_VIDEO_TYPES = new Set(["video/mp4"]);
const ACCEPT = [...ALLOWED_TYPES].join(",");
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

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

function formatDuration(seconds: number | null): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Deterministic hash of a string to a 32-bit unsigned int (FNV-1a). Used to
 * produce a stable random order: sorting by hash(id + seed) shuffles the list
 * but stays identical across re-renders for a given seed.
 */
function hashStringToInt(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

const VIDEO_PROBE_TIMEOUT_MS = 8000;

type VideoMetadata = { width: number | null; height: number | null; durationSeconds: number | null };

/**
 * Reads duration/width/height straight from the video file's own metadata,
 * entirely client-side — no upload, no server transcoding. Best-effort:
 * resolves all-null rather than rejecting, so a file the browser can't parse
 * (an exotic .mov codec, say) still uploads, just without those fields.
 */
async function readVideoMetadata(file: File): Promise<VideoMetadata> {
  if (typeof window === "undefined") return { width: null, height: null, durationSeconds: null };
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    let settled = false;
    const finish = (result: VideoMetadata) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = window.setTimeout(
      () => finish({ width: null, height: null, durationSeconds: null }),
      VIDEO_PROBE_TIMEOUT_MS,
    );
    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish({
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        durationSeconds: Number.isFinite(video.duration) ? video.duration : null,
      });
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      finish({ width: null, height: null, durationSeconds: null });
    };
    video.src = url;
  });
}

const POSTER_MAX_DIMENSION = 1600;

/**
 * Grabs a frame from a video file and encodes it as a poster JPEG, entirely
 * client-side (seek into the file, draw to a canvas, export). This is what
 * lets video uploads skip server-side transcoding altogether. Only called
 * for MP4 — see PREVIEWABLE_VIDEO_TYPES. Best-effort: resolves null on any
 * failure rather than rejecting, so the video still uploads and the gallery
 * falls back to a generic video card instead of a real frame.
 */
async function extractVideoPoster(file: File): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    const finish = (result: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = window.setTimeout(() => finish(null), VIDEO_PROBE_TIMEOUT_MS);
    video.onloadedmetadata = () => {
      // A tenth of the way in, capped at 2s — skips a common black/fade-in
      // opening frame without needing to decode much of the file.
      const seekTo = Math.min(2, (video.duration || 0) * 0.1);
      video.currentTime = Number.isFinite(seekTo) && seekTo > 0 ? seekTo : 0;
    };
    video.onseeked = () => {
      window.clearTimeout(timer);
      try {
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        if (!sourceWidth || !sourceHeight) return finish(null);
        const scale = Math.min(1, POSTER_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sourceWidth * scale);
        canvas.height = Math.round(sourceHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      finish(null);
    };
    video.src = url;
  });
}

type PresignResponse = {
  presigned_url: string;
  original_key: string;
  gallery_id: string;
  filename: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
};

/**
 * Presigns an R2 PUT for one blob and performs the direct upload, reporting
 * 0–100 progress for just this transfer. Shared by the image path, and by
 * the video path's two PUTs (original file, then poster JPEG).
 */
async function presignAndPutToR2(params: {
  blob: Blob;
  filename: string;
  contentType: string;
  galleryId: string;
  variant?: "originals" | "thumbnails";
  width?: number | null;
  height?: number | null;
  onProgress?: (pct: number) => void;
}): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  let presignData: PresignResponse;
  try {
    const res = await fetch("/api/admin/photos/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gallery_id: params.galleryId,
        filename: params.filename,
        content_type: params.contentType,
        size: params.blob.size,
        width: params.width ?? null,
        height: params.height ?? null,
        variant: params.variant,
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
    presignData = (await res.json()) as PresignResponse;
  } catch {
    return { ok: false, error: "Network error (presign)." };
  }

  const putResult = await new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignData.presigned_url);
    xhr.setRequestHeader("Content-Type", params.contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && params.onProgress) {
        params.onProgress(Math.round((event.loaded / event.total) * 100));
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
    xhr.send(params.blob);
  });

  if (!putResult.ok) return putResult;
  return { ok: true, key: presignData.original_key };
}

function derivePosterFilename(originalFilename: string): string {
  const dot = originalFilename.lastIndexOf(".");
  const stem = dot > 0 ? originalFilename.slice(0, dot) : originalFilename;
  return `${stem}-poster.jpg`;
}

/**
 * Image upload: presign → direct PUT to R2 → server processes with Sharp
 * (web + thumbnail variants) and inserts the row.
 *
 * Progress: 0–5% presigning, 5–85% upload, 85–100% server processing.
 */
async function uploadImage({
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
  onProgress(2);
  const put = await presignAndPutToR2({
    blob: file,
    filename: file.name,
    contentType: file.type,
    galleryId,
    width,
    height,
    onProgress: (pct) => onProgress(5 + Math.round(pct * 0.8)),
  });
  if (!put.ok) return put;
  onProgress(87);

  try {
    const res = await fetch("/api/admin/photos/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gallery_id: galleryId,
        original_key: put.key,
        filename: file.name,
        content_type: file.type,
        size: file.size,
        width,
        height,
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

/**
 * Video upload: presign → direct PUT of the original file to R2 → (if a
 * poster was extracted client-side) presign → direct PUT of the poster JPEG
 * → tell the server to record the row. The original video is never sent to
 * or read by a server function — see the process route's video branch.
 *
 * Progress: 0–2% presigning original, 2–70% original upload, 70–90% poster
 * upload (skipped straight through if there's no poster), 90–100% record.
 */
async function uploadVideo({
  file,
  galleryId,
  metadata,
  posterBlob,
  onProgress,
}: {
  file: File;
  galleryId: string;
  metadata: VideoMetadata;
  posterBlob: Blob | null;
  onProgress: (pct: number) => void;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  onProgress(2);
  const originalPut = await presignAndPutToR2({
    blob: file,
    filename: file.name,
    contentType: file.type,
    galleryId,
    width: metadata.width,
    height: metadata.height,
    onProgress: (pct) => onProgress(2 + Math.round(pct * 0.68)),
  });
  if (!originalPut.ok) return originalPut;
  onProgress(70);

  // A missing/failed poster degrades to a generic video card rather than
  // failing the whole upload — the video itself uploaded fine.
  let posterKey: string | null = null;
  if (posterBlob) {
    const posterPut = await presignAndPutToR2({
      blob: posterBlob,
      filename: derivePosterFilename(file.name),
      contentType: "image/jpeg",
      galleryId,
      variant: "thumbnails",
      onProgress: (pct) => onProgress(70 + Math.round(pct * 0.2)),
    });
    if (posterPut.ok) posterKey = posterPut.key;
  }
  onProgress(90);

  try {
    const res = await fetch("/api/admin/photos/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gallery_id: galleryId,
        original_key: originalPut.key,
        filename: file.name,
        content_type: file.type,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        poster_key: posterKey,
        duration_seconds: metadata.durationSeconds,
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

  const [gridSize, setGridSize] = useState<"small" | "large">("large");
  const [sortMode, setSortMode] = useState<"manual" | "newest" | "oldest" | "name-asc" | "name-desc" | "random">("manual");
  const [randomSeed, setRandomSeed] = useState(0);

  // Reordering is applied locally first and persisted in the background, so a
  // move lands instantly instead of waiting on a server round trip that
  // re-signs a URL for every photo in the gallery.
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  const [orderState, setOrderState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photos = useMemo(() => {
    if (!orderOverride) return initialPhotos;
    const byId = new Map(initialPhotos.map((p) => [p.id, p]));
    const ordered = orderOverride
      .map((id) => byId.get(id))
      .filter((p): p is PhotoWithUrls => Boolean(p));
    const placed = new Set(ordered.map((p) => p.id));
    return [...ordered, ...initialPhotos.filter((p) => !placed.has(p.id))];
  }, [initialPhotos, orderOverride]);

  const persistOrder = useCallback(
    async (ids: string[]) => {
      setOrderState("saving");
      try {
        const res = await fetch(`/api/admin/galleries/${galleryId}/photo-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_ids: ids }),
        });
        setOrderState(res.ok ? "saved" : "error");
      } catch {
        setOrderState("error");
      }
    },
    [galleryId],
  );

  const scheduleOrderSave = useCallback(
    (ids: string[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setOrderState("saving");
      saveTimerRef.current = setTimeout(() => void persistOrder(ids), 700);
    },
    [persistOrder],
  );

  const reorderPhoto = useCallback(
    (id: string, target: "up" | "down" | "top" | "bottom") => {
      const ids = photos.map((p) => p.id);
      const from = ids.indexOf(id);
      if (from === -1) return;
      const to =
        target === "up"
          ? from - 1
          : target === "down"
            ? from + 1
            : target === "top"
              ? 0
              : ids.length - 1;
      if (to === from || to < 0 || to >= ids.length) return;
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setOrderOverride(next);
      scheduleOrderSave(next);
    },
    [photos, scheduleOrderSave],
  );

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

        const isVideo = VIDEO_TYPES.has(file.type);
        const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.size > maxBytes) {
          validated.push({
            id,
            file,
            status: "error",
            progress: 0,
            error: `Too large (${formatBytes(file.size)}). Max ${isVideo ? "500 MB" : "50 MB"}.`,
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
        const onProgress = (pct: number) => {
          setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u)));
        };

        let result: { ok: true } | { ok: false; error: string };
        if (VIDEO_TYPES.has(item.file.type)) {
          const metadata = await readVideoMetadata(item.file);
          // Frame extraction only for MP4 — see PREVIEWABLE_VIDEO_TYPES. A
          // .mov never attempts inline playback, so a poster for it would
          // never be shown.
          const posterBlob = PREVIEWABLE_VIDEO_TYPES.has(item.file.type)
            ? await extractVideoPoster(item.file)
            : null;
          result = await uploadVideo({
            file: item.file,
            galleryId,
            metadata,
            posterBlob,
            onProgress,
          });
        } else {
          const dims = await readImageDimensions(item.file);
          result = await uploadImage({
            file: item.file,
            galleryId,
            width: dims?.width ?? null,
            height: dims?.height ?? null,
            onProgress,
          });
        }

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

  const sortedPhotos = useMemo(() => {
    if (sortMode === "manual") return photos;
    const copy = [...photos];
    if (sortMode === "newest") {
      copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortMode === "oldest") {
      copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortMode === "name-asc") {
      copy.sort((a, b) => a.filename.localeCompare(b.filename));
    } else if (sortMode === "name-desc") {
      copy.sort((a, b) => b.filename.localeCompare(a.filename));
    } else if (sortMode === "random") {
      const seed = String(randomSeed);
      copy.sort(
        (a, b) => hashStringToInt(a.id + seed) - hashStringToInt(b.id + seed),
      );
    }
    return copy;
  }, [photos, sortMode, randomSeed]);

  const photoListItems = useMemo(
    () =>
      sortedPhotos.map((photo, index) => ({
        photo,
        index,
        isFirst: index === 0,
        isLast: index === sortedPhotos.length - 1,
        isCover: photo.id === coverPhotoId,
      })),
    [sortedPhotos, coverPhotoId],
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
          "relative rounded-md border-2 border-dashed bg-admin-surface p-8 text-center transition " +
          (isDragging
            ? "border-admin-accent bg-admin-copper/10"
            : "border-admin-ink/15 hover:border-admin-ink/30")
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
          <span className="flex size-12 items-center justify-center rounded-full bg-admin-ink/8 text-admin-ink">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <p className="text-base font-medium text-admin-ink">
            Drop photos or videos here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-admin-accent underline decoration-admin-accent/40 underline-offset-4 hover:decoration-admin-accent"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-admin-ink/65">
            JPG, PNG, or WebP up to 50 MB · MP4 or MOV up to 500 MB · multi-select supported
          </p>
          <p className="text-[11px] text-admin-ink/50">
            MP4 shows and plays in the gallery. MOV uploads for download only and won&apos;t
            preview inline.
          </p>
        </div>
      </div>

      {(activeUploads.length > 0 || completedUploads.length > 0 || erroredUploads.length > 0) && (
        <div className="rounded-md border border-admin-ink/10 bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-admin-ink">
              Uploads: {completedUploads.length} done, {activeUploads.length} active,{" "}
              {erroredUploads.length} failed
            </p>
            <div className="flex gap-2">
              {completedUploads.length > 0 && activeUploads.length === 0 && (
                <button
                  type="button"
                  onClick={clearFinished}
                  className="text-xs text-admin-ink/65 hover:text-admin-ink"
                >
                  Clear finished
                </button>
              )}
              {erroredUploads.length > 0 && (
                <button
                  type="button"
                  onClick={dismissErrors}
                  className="text-xs text-admin-danger/70 hover:text-admin-danger"
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
                className="flex items-center gap-3 rounded-sm border border-admin-ink/8 bg-admin-surface px-3 py-2 text-xs"
              >
                {u.status === "uploading" || u.status === "pending" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-admin-accent" aria-hidden="true" />
                ) : u.status === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-admin-success" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-admin-danger" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-admin-ink">{u.file.name}</p>
                  {u.status === "error" ? (
                    <p className="text-admin-danger">{u.error}</p>
                  ) : u.status === "uploading" ? (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-admin-ink/10">
                      <div
                        className="h-full bg-admin-accent transition-all"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  ) : u.status === "success" ? (
                    <p className="text-admin-ink/65">Uploaded · {formatBytes(u.file.size)}</p>
                  ) : (
                    <p className="text-admin-ink/65">Queued</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="rounded-md border border-dashed border-admin-ink/15 bg-admin-surface p-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-admin-ink/8">
            <ImageOff className="size-5 text-admin-ink/60" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-medium text-admin-ink">No photos yet.</p>
          <p className="mt-1 text-sm text-admin-ink/65">
            Drop files above to upload your first photos.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Photos
              <span className="ml-2 text-sm font-normal text-admin-ink/65">
                {photos.length}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort dropdown */}
              <div className="flex items-center gap-1.5 rounded-md border border-admin-ink/12 bg-white/60 px-2 py-1 transition focus-within:border-admin-copper">
                <ArrowUpDown className="size-3.5 shrink-0 text-admin-ink/65" aria-hidden="true" />
                <select
                  value={sortMode}
                  onChange={(e) => {
                    const next = e.target.value as typeof sortMode;
                    if (next === "random") setRandomSeed(Date.now());
                    setSortMode(next);
                  }}
                  className="bg-transparent text-xs text-admin-ink outline-none cursor-pointer"
                >
                  <option value="manual">Manual order</option>
                  <option value="newest">Uploaded: Newest first</option>
                  <option value="oldest">Uploaded: Oldest first</option>
                  <option value="name-asc">Name: A → Z</option>
                  <option value="name-desc">Name: Z → A</option>
                  <option value="random">Random</option>
                </select>
                {sortMode === "random" && (
                  <button
                    type="button"
                    onClick={() => setRandomSeed(Date.now())}
                    title="Shuffle again"
                    className="ml-0.5 rounded p-0.5 text-admin-accent transition hover:bg-admin-accent/10"
                  >
                    <Shuffle className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Save order — persists the current displayed order as the gallery's real order */}
              <button
                type="button"
                onClick={() => {
                  if (
                    !window.confirm(
                      "Save this order? This becomes the gallery's order. Clients will see photos in this order.",
                    )
                  )
                    return;
                  const ids = sortedPhotos.map((p) => p.id);
                  setOrderOverride(ids);
                  setSortMode("manual");
                  void persistOrder(ids);
                }}
                disabled={orderState === "saving"}
                title="Save the current order as the gallery's order. Clients will see this order."
                className="inline-flex items-center gap-1.5 rounded-md border border-admin-accent/40 bg-admin-accent/10 px-2.5 py-1.5 text-xs text-admin-accent transition hover:bg-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="size-3.5" aria-hidden="true" />
                Save order
              </button>

              {orderState !== "idle" && (
                <span
                  className={
                    "text-xs " +
                    (orderState === "error" ? "text-admin-danger" : "text-admin-ink/70")
                  }
                >
                  {orderState === "saving"
                    ? "Saving order…"
                    : orderState === "saved"
                      ? "Order saved"
                      : "Order not saved"}
                </span>
              )}

              {/* Grid size toggle */}
              <div className="flex items-center rounded-md border border-admin-ink/12 bg-white/60">
                <button
                  type="button"
                  onClick={() => setGridSize("large")}
                  title="Large grid"
                  className={
                    "flex items-center gap-1 rounded-l-md px-2.5 py-1.5 text-xs transition " +
                    (gridSize === "large"
                      ? "bg-admin-ink text-white"
                      : "text-admin-ink/60 hover:bg-admin-ink/6")
                  }
                >
                  <Grid2X2 className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize("small")}
                  title="Small grid"
                  className={
                    "flex items-center gap-1 rounded-r-md px-2.5 py-1.5 text-xs transition " +
                    (gridSize === "small"
                      ? "bg-admin-ink text-white"
                      : "text-admin-ink/60 hover:bg-admin-ink/6")
                  }
                >
                  <Grid3X3 className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Select all / deselect all */}
              {selectedIds.size === 0 ? (
                <button
                  type="button"
                  onClick={selectAll}
                  className="inline-flex items-center gap-2 rounded-md border border-admin-ink/12 px-3 py-1.5 text-xs text-admin-ink/68 hover:bg-admin-ink/6"
                >
                  <CheckSquare className="size-3.5" aria-hidden="true" />
                  Select all
                </button>
              ) : (
                <button
                  type="button"
                  onClick={deselectAll}
                  className="inline-flex items-center gap-2 rounded-md border border-admin-ink/12 px-3 py-1.5 text-xs text-admin-ink/68 hover:bg-admin-ink/6"
                >
                  <Square className="size-3.5" aria-hidden="true" />
                  Deselect all
                </button>
              )}
              <button
                type="button"
                onClick={runBackfill}
                disabled={backfillRunning || missingVariantPhotos.length === 0}
                className="inline-flex items-center gap-2 rounded-md border border-admin-accent/40 bg-admin-copper/15 px-3 py-1.5 text-xs font-medium text-admin-accent transition hover:bg-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                  : `Variants (${missingVariantPhotos.length} missing)`}
              </button>
              {coverPhotoId ? (
                <form action={(form) => runAction(form, clearGalleryCover)}>
                  <input type="hidden" name="gallery_id" value={galleryId} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-md border border-admin-ink/12 px-3 py-1.5 text-xs text-admin-ink/68 hover:bg-admin-ink/6"
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
            <div className="flex items-center justify-between gap-3 rounded-md border border-admin-danger/20 bg-admin-danger/8 px-4 py-3">
              <p className="text-sm font-medium text-admin-danger">
                {selectedIds.size} photo{selectedIds.size === 1 ? "" : "s"} selected
              </p>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-admin-danger px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#6e2419] disabled:cursor-not-allowed disabled:opacity-50"
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

          <ul
            className={
              "mt-5 grid gap-3 " +
              (gridSize === "small"
                ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")
            }
          >
            {photoListItems.map(({ photo, isFirst, isLast, isCover }, index) => {
              const aspect = photo.width && photo.height ? photo.width / photo.height : 1;
              return (
                <li
                  key={photo.id}
                  className={
                    "group overflow-hidden rounded-md border bg-admin-surface transition " +
                    (selectedIds.has(photo.id)
                      ? "border-admin-danger shadow-[0_0_0_2px_#8a2f24]"
                      : isCover
                        ? "border-admin-accent shadow-[0_0_0_1px_#9b744f]"
                        : "border-admin-ink/10")
                  }
                >
                  <div className="relative bg-admin-ink/8" style={{ aspectRatio: aspect || 1 }}>
                    {/* Selection checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(photo.id)}
                      aria-label={selectedIds.has(photo.id) ? "Deselect photo" : "Select photo"}
                      className={
                        "absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full border-2 transition " +
                        (selectedIds.has(photo.id)
                          ? "border-admin-danger bg-admin-danger text-white"
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
                    {photo.media_type === "video" ? (
                      photo.thumbnail_key && photo.thumbnail_url ? (
                        <Image
                          src={photo.thumbnail_url}
                          alt={`Video ${index + 1} of ${photoListItems.length}`}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className={"object-cover " + (photo.is_hidden ? "opacity-50" : "")}
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-admin-ink/15 text-admin-ink/40">
                          <Film className="size-8" aria-hidden="true" />
                        </div>
                      )
                    ) : photo.display_url ? (
                      <Image
                        src={photo.thumbnail_url || photo.display_url}
                        alt={`Photo ${index + 1} of ${photoListItems.length}`}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className={
                          "object-cover " + (photo.is_hidden ? "opacity-50" : "")
                        }
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-admin-ink/35">
                        <ImageOff className="size-6" aria-hidden="true" />
                      </div>
                    )}
                    {photo.media_type === "video" && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                          <Play className="size-4 translate-x-[1px]" aria-hidden="true" fill="currentColor" />
                        </span>
                      </span>
                    )}
                    {photo.media_type === "video" && photo.mime_type === "video/quicktime" && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-admin-copper px-2 py-0.5 text-[10px] font-medium text-white">
                        MOV · download only
                      </span>
                    )}
                    {photo.media_type === "video" && formatDuration(photo.duration_seconds) && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {formatDuration(photo.duration_seconds)}
                      </span>
                    )}
                    {isCover && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-admin-accent px-2 py-0.5 text-[10px] font-medium text-white">
                        <Star className="size-3" aria-hidden="true" />
                        Cover
                      </span>
                    )}
                    {photo.is_hidden && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-admin-ink/80 px-2 py-0.5 text-[10px] font-medium text-white">
                        <EyeOff className="size-3" aria-hidden="true" />
                        Hidden
                      </span>
                    )}
                    {photo.media_type === "image" && (() => {
                      const state = backfillStates[photo.id];
                      const hasVariants = Boolean(photo.web_key && photo.thumbnail_key);
                      if (state?.status === "running") {
                        return (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-admin-ink/85 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                            Optimizing
                          </span>
                        );
                      }
                      if (state?.status === "error") {
                        return (
                          <span
                            className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-admin-danger px-2 py-0.5 text-[10px] font-medium text-white"
                            title={state.error}
                          >
                            <XCircle className="size-3" aria-hidden="true" />
                            Failed
                          </span>
                        );
                      }
                      if (hasVariants) {
                        return (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-admin-success/90 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Sparkles className="size-3" aria-hidden="true" />
                            Optimized
                          </span>
                        );
                      }
                      return (
                        <span
                          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-admin-copper px-2 py-0.5 text-[10px] font-medium text-white"
                          title="Web/thumbnail variants missing. Click Generate missing variants."
                        >
                          <TriangleAlert className="size-3" aria-hidden="true" />
                          Original only
                        </span>
                      );
                    })()}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-xs text-admin-ink/65" title={photo.filename}>
                      {photo.filename}
                    </p>
                    <p className="mt-0.5 text-[10px] text-admin-ink/65">
                      {photo.width && photo.height ? `${photo.width}×${photo.height} · ` : ""}
                      {formatBytes(photo.size_bytes)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {photo.media_type === "image" && (
                        <form action={(form) => runAction(form, setGalleryCover)}>
                          <input type="hidden" name="photo_id" value={photo.id} />
                          <input type="hidden" name="gallery_id" value={galleryId} />
                          <button
                            type="submit"
                            disabled={pending || isCover}
                            title={isCover ? "Current cover" : "Set as cover"}
                            className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[10px] text-admin-ink/65 hover:bg-admin-ink hover:text-admin-surface disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Star className="size-3" aria-hidden="true" />
                            Cover
                          </button>
                        </form>
                      )}

                      <form action={(form) => runAction(form, togglePhotoHidden)}>
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="gallery_id" value={galleryId} />
                        <input type="hidden" name="next" value={String(!photo.is_hidden)} />
                        <button
                          type="submit"
                          disabled={pending}
                          title={photo.is_hidden ? "Unhide" : "Hide"}
                          className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[10px] text-admin-ink/65 hover:bg-admin-ink hover:text-admin-surface"
                        >
                          {photo.is_hidden ? (
                            <Eye className="size-3" aria-hidden="true" />
                          ) : (
                            <EyeOff className="size-3" aria-hidden="true" />
                          )}
                          {photo.is_hidden ? "Show" : "Hide"}
                        </button>
                      </form>

                      {sortMode === "manual" && (
                        <>
                          <button
                            type="button"
                            onClick={() => reorderPhoto(photo.id, "top")}
                            disabled={isFirst}
                            title="Move to top"
                            className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[10px] text-admin-ink/65 hover:bg-admin-ink hover:text-admin-surface disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowUpToLine className="size-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderPhoto(photo.id, "up")}
                            disabled={isFirst}
                            title="Move up"
                            className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[10px] text-admin-ink/65 hover:bg-admin-ink hover:text-admin-surface disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowUp className="size-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderPhoto(photo.id, "down")}
                            disabled={isLast}
                            title="Move down"
                            className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[10px] text-admin-ink/65 hover:bg-admin-ink hover:text-admin-surface disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowDown className="size-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderPhoto(photo.id, "bottom")}
                            disabled={isLast}
                            title="Move to bottom"
                            className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[10px] text-admin-ink/65 hover:bg-admin-ink hover:text-admin-surface disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowDownToLine className="size-3" aria-hidden="true" />
                          </button>
                        </>
                      )}

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
                          className="inline-flex items-center gap-1 rounded-md border border-admin-danger/20 min-h-9 px-2 py-1 text-[10px] text-admin-danger hover:bg-admin-danger hover:text-admin-surface disabled:opacity-40"
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
