"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  EyeOff,
  ImageOff,
  Loader2,
  Pencil,
  Star,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import type { PortfolioItemWithUrls } from "@/lib/portfolio";
import { categoryLabels } from "@/data/photography";
import {
  deletePortfolioItem,
  movePortfolioItem,
  togglePortfolioFeatured,
  togglePortfolioHidden,
  updatePortfolioItem,
} from "@/app/admin/(protected)/portfolio/actions";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ORIENTATIONS = ["portrait", "landscape", "square"] as const;
const CATEGORY_ENTRIES = Object.entries(categoryLabels) as [string, string][];

const inputClass =
  "min-h-10 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition focus:border-admin-copper";

type UploadItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
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

async function uploadOne({
  file,
  category,
  width,
  height,
  onProgress,
}: {
  file: File;
  category: string;
  width: number | null;
  height: number | null;
  onProgress: (pct: number) => void;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  onProgress(2);
  let presign: { presigned_url: string; original_key: string };
  try {
    const res = await fetch("/api/admin/portfolio/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, content_type: file.type, size: file.size, width, height }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: b.error ?? `Presign failed (${res.status})` };
    }
    presign = (await res.json()) as typeof presign;
  } catch {
    return { ok: false, error: "Network error (presign)." };
  }

  const put = await new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presign.presigned_url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(5 + Math.round((e.loaded / e.total) * 80));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve({ ok: true })
        : resolve({ ok: false, error: `Upload failed (${xhr.status}).` });
    xhr.onerror = () => resolve({ ok: false, error: "Network error (upload)." });
    xhr.send(file);
  });
  if (!put.ok) return put;
  onProgress(88);

  try {
    const res = await fetch("/api/admin/portfolio/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_key: presign.original_key,
        filename: file.name,
        content_type: file.type,
        size: file.size,
        width,
        height,
        category,
      }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: b.error ?? `Processing failed (${res.status})` };
    }
  } catch {
    return { ok: false, error: "Network error (processing)." };
  }
  onProgress(100);
  return { ok: true };
}

export function PortfolioManager({ initialItems }: { initialItems: PortfolioItemWithUrls[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>(CATEGORY_ENTRIES[0]?.[0] ?? "portraits");
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = initialItems;

  const runAction = (form: FormData, action: (fd: FormData) => Promise<void>) => {
    startTransition(async () => {
      await action(form);
      router.refresh();
    });
  };

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;
      const validated: UploadItem[] = files.map((file) => {
        const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
        if (!ALLOWED_TYPES.has(file.type)) {
          return { id, file, status: "error", progress: 0, error: "Unsupported type." };
        }
        if (file.size > MAX_BYTES) {
          return { id, file, status: "error", progress: 0, error: "Too large (max 50 MB)." };
        }
        return { id, file, status: "pending", progress: 0 };
      });
      setUploads((prev) => [...prev, ...validated]);

      for (const item of validated) {
        if (item.status === "error") continue;
        setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: "uploading" } : u)));
        const dims = await readImageDimensions(item.file);
        const result = await uploadOne({
          file: item.file,
          category: uploadCategory,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          onProgress: (pct) =>
            setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))),
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
    [uploadCategory, router],
  );

  return (
    <div className="space-y-8">
      {/* Upload */}
      <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-admin-ink">Upload to category</label>
          <select
            className={inputClass}
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            {CATEGORY_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="text-xs text-admin-ink/50">You can change a photo&apos;s category after upload.</span>
        </div>
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
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
          }}
          className={
            "mt-4 rounded-md border-2 border-dashed p-8 text-center transition " +
            (isDragging ? "border-admin-accent bg-admin-copper/10" : "border-admin-ink/15 hover:border-admin-ink/30")
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
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-admin-ink/8 text-admin-ink">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-medium text-admin-ink">
            Drop photos here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-admin-accent underline decoration-admin-accent/40 underline-offset-4 hover:decoration-admin-accent"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-admin-ink/55">JPG, PNG, or WebP · up to 50 MB each</p>
        </div>

        {uploads.length > 0 && (
          <ul className="mt-4 space-y-2">
            {uploads.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-sm border border-admin-ink/8 bg-white/60 px-3 py-2 text-xs"
              >
                {u.status === "uploading" || u.status === "pending" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-admin-accent" aria-hidden="true" />
                ) : u.status === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-admin-success" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-admin-danger" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate text-admin-ink">{u.file.name}</span>
                {u.status === "error" ? (
                  <span className="text-admin-danger">{u.error}</span>
                ) : u.status === "uploading" ? (
                  <span className="text-admin-ink/55">{u.progress}%</span>
                ) : u.status === "success" ? (
                  <span className="text-admin-ink/55">Done</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Items */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Photos
          <span className="ml-2 text-sm font-normal text-admin-ink/45">{items.length}</span>
        </h2>

        {items.length === 0 ? (
          <div className="mt-5 rounded-md border border-dashed border-admin-ink/15 bg-admin-surface p-12 text-center">
            <ImageOff className="mx-auto size-6 text-admin-ink/40" aria-hidden="true" />
            <p className="mt-3 text-sm text-admin-ink/55">No portfolio photos yet. Upload above to begin.</p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface"
              >
                <div className="flex gap-4 p-3">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-sm bg-admin-ink/8">
                    {item.thumbnail_url || item.display_url ? (
                      <Image
                        src={item.thumbnail_url || item.display_url}
                        alt={item.alt ?? item.title}
                        fill
                        sizes="96px"
                        className={"object-cover " + (item.is_hidden ? "opacity-50" : "")}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageOff className="size-5 text-admin-ink/35" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-admin-ink">{item.title}</p>
                      {item.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-admin-copper px-2 py-0.5 text-[10px] font-medium text-white">
                          <Star className="size-3" aria-hidden="true" />
                          Featured
                        </span>
                      )}
                      {item.is_hidden && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-admin-ink/80 px-2 py-0.5 text-[10px] font-medium text-white">
                          <EyeOff className="size-3" aria-hidden="true" />
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-admin-ink/55">
                      {categoryLabels[item.category]}
                      {item.event_date ? ` · ${item.event_date}` : ""}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[11px] text-admin-ink/70 hover:bg-admin-ink hover:text-admin-surface"
                      >
                        <Pencil className="size-3" aria-hidden="true" />
                        {editingId === item.id ? "Close" : "Edit"}
                      </button>

                      <form action={(fd) => runAction(fd, togglePortfolioFeatured)}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="next" value={String(!item.featured)} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[11px] text-admin-ink/70 hover:bg-admin-ink hover:text-admin-surface disabled:opacity-40"
                        >
                          <Star className="size-3" aria-hidden="true" />
                          {item.featured ? "Unfeature" : "Feature"}
                        </button>
                      </form>

                      <form action={(fd) => runAction(fd, togglePortfolioHidden)}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="next" value={String(!item.is_hidden)} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[11px] text-admin-ink/70 hover:bg-admin-ink hover:text-admin-surface disabled:opacity-40"
                        >
                          <EyeOff className="size-3" aria-hidden="true" />
                          {item.is_hidden ? "Show" : "Hide"}
                        </button>
                      </form>

                      <form action={(fd) => runAction(fd, movePortfolioItem)}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={pending || index === 0}
                          title="Move up"
                          className="inline-flex items-center rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[11px] text-admin-ink/70 hover:bg-admin-ink hover:text-admin-surface disabled:opacity-40"
                        >
                          <ArrowUp className="size-3" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={(fd) => runAction(fd, movePortfolioItem)}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={pending || index === items.length - 1}
                          title="Move down"
                          className="inline-flex items-center rounded-md border border-admin-ink/10 min-h-9 px-2 py-1 text-[11px] text-admin-ink/70 hover:bg-admin-ink hover:text-admin-surface disabled:opacity-40"
                        >
                          <ArrowDown className="size-3" aria-hidden="true" />
                        </button>
                      </form>

                      <form
                        action={(fd) => {
                          if (!window.confirm(`Delete "${item.title}"? This removes the photo permanently.`)) return;
                          runAction(fd, deletePortfolioItem);
                        }}
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-admin-danger/20 min-h-9 px-2 py-1 text-[11px] text-admin-danger hover:bg-admin-danger hover:text-white disabled:opacity-40"
                        >
                          <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {editingId === item.id && (
                  <form
                    action={(fd) => {
                      runAction(fd, updatePortfolioItem);
                      setEditingId(null);
                    }}
                    className="grid gap-3 border-t border-admin-ink/10 bg-white/40 p-4 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <label className="grid gap-1 text-xs font-medium text-admin-ink">
                      Title
                      <input className={inputClass} name="title" defaultValue={item.title} />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink">
                      Category
                      <select className={inputClass} name="category" defaultValue={item.category}>
                        {CATEGORY_ENTRIES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink">
                      Event date
                      <input className={inputClass} type="date" name="event_date" defaultValue={item.event_date ?? ""} />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink">
                      Location
                      <input className={inputClass} name="location" defaultValue={item.location ?? ""} />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink">
                      Orientation
                      <select className={inputClass} name="orientation" defaultValue={item.orientation}>
                        {ORIENTATIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 self-end text-xs font-medium text-admin-ink">
                      <input type="checkbox" name="featured" defaultChecked={item.featured} className="size-4 accent-admin-accent" />
                      Featured (shown on homepage)
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink sm:col-span-2">
                      Caption (shown on hover)
                      <textarea
                        className="min-h-16 rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none focus:border-admin-copper"
                        name="caption"
                        defaultValue={item.caption ?? ""}
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink sm:col-span-2">
                      Alt text (accessibility)
                      <input className={inputClass} name="alt" defaultValue={item.alt ?? ""} />
                    </label>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-md bg-admin-ink px-4 py-2 text-sm font-medium text-admin-surface disabled:opacity-50"
                      >
                        Save changes
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
