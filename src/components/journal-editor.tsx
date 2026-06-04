"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GripVertical,
  Heading,
  Image as ImageIcon,
  Images,
  Loader2,
  Minus,
  Plus,
  Quote,
  Save,
  Settings2,
  Text as TextIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { JOURNAL_TAGS } from "@/lib/journal-types";
import type { BlockType, JournalBlock, JournalPostRecord } from "@/lib/journal-types";
import { deleteJournalPost, saveJournalPost } from "@/app/admin/(protected)/journal/actions";

const inputClass =
  "min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none transition focus:border-admin-copper";

const ACCENT_PRESETS = [
  { hex: "#b98257", label: "Copper" },
  { hex: "#9b744f", label: "Bronze" },
  { hex: "#7c8b76", label: "Sage" },
  { hex: "#6b7f99", label: "Slate blue" },
  { hex: "#a36a73", label: "Rose" },
  { hex: "#8a7ca8", label: "Plum" },
];

const ADD_BUTTONS: { type: BlockType; label: string; icon: typeof TextIcon }[] = [
  { type: "paragraph", label: "Text", icon: TextIcon },
  { type: "heading", label: "Heading", icon: Heading },
  { type: "image", label: "Photo", icon: ImageIcon },
  { type: "image_row", label: "Photo row", icon: Images },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "divider", label: "Divider", icon: Minus },
];

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b${Date.now()}${Math.random().toString(36).slice(2)}`;
}

function newBlock(type: BlockType): JournalBlock {
  const id = uid();
  switch (type) {
    case "heading":
      return { id, type, text: "", level: 2 };
    case "paragraph":
      return { id, type, text: "" };
    case "quote":
      return { id, type, text: "" };
    case "image":
      return { id, type, imageKey: null, imageUrl: null, caption: "", alt: "", width: "normal" };
    case "image_row":
      return { id, type, images: [{ imageKey: null, imageUrl: null }, { imageKey: null, imageUrl: null }] };
    case "divider":
      return { id, type };
  }
}

/** Upload one image to R2 via presign → PUT → process. Returns the stored key + signed preview URL. */
async function uploadImage(file: File): Promise<{ key: string; url: string } | { error: string }> {
  let presign: { presigned_url: string; original_key: string };
  try {
    const res = await fetch("/api/admin/journal/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, content_type: file.type, size: file.size }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: b.error ?? `Presign failed (${res.status})` };
    }
    presign = (await res.json()) as typeof presign;
  } catch {
    return { error: "Network error (presign)." };
  }

  try {
    const put = await fetch(presign.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) return { error: `Upload failed (${put.status}).` };
  } catch {
    return { error: "Network error (upload)." };
  }

  try {
    const res = await fetch("/api/admin/journal/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ original_key: presign.original_key, filename: file.name }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: b.error ?? `Processing failed (${res.status})` };
    }
    return (await res.json()) as { key: string; url: string };
  } catch {
    return { error: "Network error (processing)." };
  }
}

/** Strip transient signed preview URLs from image blocks that have a stored key. */
function serializeBlocks(blocks: JournalBlock[]): JournalBlock[] {
  return blocks.map((block) => {
    if (block.type === "image" && block.imageKey) return { ...block, imageUrl: null };
    if (block.type === "image_row") {
      return {
        ...block,
        images: block.images.map((img) => (img.imageKey ? { ...img, imageUrl: null } : img)),
      };
    }
    return block;
  });
}

type Props = { record: JournalPostRecord; coverUrl: string | null };

export function JournalEditor({ record, coverUrl: initialCoverUrl }: Props) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  const [title, setTitle] = useState(record.title === "Untitled post" ? "" : record.title);
  const [slug, setSlug] = useState(record.slug.startsWith("untitled-") ? "" : record.slug);
  const [excerpt, setExcerpt] = useState(record.excerpt ?? "");
  const [tag, setTag] = useState(record.tag ?? "");
  const [postDate, setPostDate] = useState(record.post_date);
  const [published, setPublished] = useState(record.published);
  const [accentHex, setAccentHex] = useState(record.accent_hex ?? "");
  const [bodyFont, setBodyFont] = useState(record.body_font ?? "serif");

  const [coverKey, setCoverKey] = useState(record.cover_key ?? "");
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? "");
  const [coverAlt, setCoverAlt] = useState(record.cover_alt ?? "");
  const [coverBusy, setCoverBusy] = useState(false);

  const [blocks, setBlocks] = useState<JournalBlock[]>(record.content ?? []);
  const [showSettings, setShowSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const patchBlock = (id: string, patch: Partial<JournalBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as JournalBlock) : b)));

  const addBlock = (type: BlockType) => setBlocks((prev) => [...prev, newBlock(type)]);

  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));

  const moveBlock = (id: string, dir: "up" | "down") =>
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = dir === "up" ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const onCoverFile = async (file: File | undefined) => {
    if (!file) return;
    setCoverBusy(true);
    setError(null);
    const result = await uploadImage(file);
    setCoverBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCoverKey(result.key);
    setCoverUrl(result.url);
  };

  const onBlockImage = async (blockId: string, file: File | undefined, slot?: number) => {
    if (!file) return;
    setError(null);
    const result = await uploadImage(file);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        if (b.type === "image") return { ...b, imageKey: result.key, imageUrl: result.url };
        if (b.type === "image_row" && typeof slot === "number") {
          const images = [...b.images];
          images[slot] = { imageKey: result.key, imageUrl: result.url };
          return { ...b, images };
        }
        return b;
      }),
    );
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.set("id", record.id);
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("excerpt", excerpt);
    fd.set("tag", tag);
    fd.set("post_date", postDate);
    fd.set("cover_key", coverKey);
    fd.set("cover_url", coverKey ? "" : coverUrl);
    fd.set("cover_alt", coverAlt);
    fd.set("accent_hex", accentHex);
    fd.set("body_font", bodyFont);
    if (published) fd.set("published", "on");
    fd.set("content", JSON.stringify(serializeBlocks(blocks)));
    startSaving(async () => {
      try {
        await saveJournalPost(fd);
      } catch (e) {
        // redirect() throws NEXT_REDIRECT by design; only surface real errors.
        if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
          return;
        }
        setError("Could not save. Please try again.");
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const fd = new FormData();
    fd.set("id", record.id);
    startSaving(async () => {
      await deleteJournalPost(fd);
      router.push("/admin/journal");
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Top bar */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-admin-ink/10 bg-admin-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/journal" className="text-sm text-admin-ink/60 hover:text-admin-ink">
            ← Journal
          </Link>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="size-4 accent-admin-accent"
            />
            <span className={published ? "font-medium text-admin-success" : "text-admin-ink/60"}>
              {published ? "Published" : "Draft"}
            </span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {!record.slug.startsWith("untitled-") ? (
            <Link
              href={`/journal/${record.slug}`}
              target="_blank"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-sm text-admin-ink/70 hover:text-admin-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              View
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-admin-danger/30 px-3 text-sm text-admin-danger hover:bg-admin-danger/5 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-admin-danger/30 bg-admin-danger/5 px-4 py-2 text-sm text-admin-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        {/* ── Editor column ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full bg-transparent font-serif text-3xl font-medium tracking-tight text-admin-ink outline-none placeholder:text-admin-ink/30"
          />

          {/* Settings */}
          <div className="rounded-md border border-admin-ink/10 bg-admin-surface">
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-admin-ink"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4 text-admin-accent" aria-hidden="true" />
                Post settings
              </span>
              <span className="text-admin-ink/45">{showSettings ? "Hide" : "Show"}</span>
            </button>
            {showSettings ? (
              <div className="grid gap-4 border-t border-admin-ink/10 p-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Web address (slug)</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto from title"
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Date</span>
                  <input type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)} className={inputClass} />
                </label>
                <label className="grid gap-1 text-sm sm:col-span-2">
                  <span className="font-medium">Excerpt</span>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={2}
                    placeholder="One or two lines shown in the journal list."
                    className={`${inputClass} resize-y`}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Category</span>
                  <select value={tag} onChange={(e) => setTag(e.target.value)} className={inputClass}>
                    <option value="">None</option>
                    {JOURNAL_TAGS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Body font</span>
                  <select value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} className={inputClass}>
                    <option value="serif">Serif (elegant)</option>
                    <option value="sans">Sans (modern)</option>
                  </select>
                </label>

                {/* Accent */}
                <div className="grid gap-1.5 text-sm sm:col-span-2">
                  <span className="font-medium">Accent color</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setAccentHex(p.hex)}
                        title={p.label}
                        aria-label={p.label}
                        aria-pressed={accentHex === p.hex}
                        className={
                          "size-7 rounded-full border-2 transition " +
                          (accentHex === p.hex ? "border-admin-ink" : "border-transparent")
                        }
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setAccentHex("")}
                      aria-pressed={accentHex === ""}
                      className={
                        "min-h-7 rounded-full border px-3 text-xs transition " +
                        (accentHex === "" ? "border-admin-ink text-admin-ink" : "border-admin-ink/20 text-admin-ink/55")
                      }
                    >
                      Default
                    </button>
                  </div>
                </div>

                {/* Cover */}
                <div className="grid gap-2 text-sm sm:col-span-2">
                  <span className="font-medium">Cover photo</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-admin-ink/8">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-admin-ink/30">
                          <ImageIcon className="size-5" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => onCoverFile(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={coverBusy}
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/75 disabled:opacity-50"
                      >
                        {coverBusy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
                        {coverUrl ? "Replace" : "Upload cover"}
                      </button>
                      {coverUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCoverKey("");
                            setCoverUrl("");
                          }}
                          className="text-xs text-admin-danger/80 hover:text-admin-danger"
                        >
                          Remove cover
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    value={coverAlt}
                    onChange={(e) => setCoverAlt(e.target.value)}
                    placeholder="Describe the cover photo (for accessibility)"
                    className={inputClass}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Blocks */}
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <BlockCard
                key={block.id}
                block={block}
                first={i === 0}
                last={i === blocks.length - 1}
                onPatch={patchBlock}
                onMove={moveBlock}
                onRemove={removeBlock}
                onImage={onBlockImage}
              />
            ))}
            {blocks.length === 0 ? (
              <p className="rounded-md border border-dashed border-admin-ink/15 px-4 py-8 text-center text-sm text-admin-ink/45">
                Your post is empty. Add a block below to start writing.
              </p>
            ) : null}
          </div>

          {/* Add block */}
          <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-3">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-admin-ink/45">Add block</p>
            <div className="flex flex-wrap gap-2">
              {ADD_BUTTONS.map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => addBlock(b.type)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/75 transition hover:border-admin-copper hover:text-admin-ink"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Live preview ──────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-[120px] lg:self-start">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-admin-ink/45">
            <Plus className="size-3.5 rotate-45" aria-hidden="true" />
            Live preview
          </p>
          <div className="overflow-hidden rounded-lg border border-admin-ink/15 bg-ink text-soft-white shadow-sm">
            <Preview
              title={title}
              date={postDate}
              excerpt={excerpt}
              coverUrl={coverUrl}
              coverAlt={coverAlt}
              accentHex={accentHex}
              bodyFont={bodyFont}
              blocks={blocks}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Per-block editor card ─────────────────────────────────────────── */

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Text",
  quote: "Quote",
  image: "Photo",
  image_row: "Photo row",
  divider: "Divider",
};

function BlockCard({
  block,
  first,
  last,
  onPatch,
  onMove,
  onRemove,
  onImage,
}: {
  block: JournalBlock;
  first: boolean;
  last: boolean;
  onPatch: (id: string, patch: Partial<JournalBlock>) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onRemove: (id: string) => void;
  onImage: (id: string, file: File | undefined, slot?: number) => void;
}) {
  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-admin-ink/45">
          <GripVertical className="size-3.5" aria-hidden="true" />
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(block.id, "up")}
            disabled={first}
            className="rounded p-1 text-admin-ink/55 hover:bg-admin-ink/6 disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(block.id, "down")}
            disabled={last}
            className="rounded p-1 text-admin-ink/55 hover:bg-admin-ink/6 disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            className="rounded p-1 text-admin-danger/80 hover:bg-admin-danger/5"
            aria-label="Delete block"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <BlockFields block={block} onPatch={onPatch} onImage={onImage} />
    </div>
  );
}

function BlockFields({
  block,
  onPatch,
  onImage,
}: {
  block: JournalBlock;
  onPatch: (id: string, patch: Partial<JournalBlock>) => void;
  onImage: (id: string, file: File | undefined, slot?: number) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="grid gap-2">
          <input
            value={block.text}
            onChange={(e) => onPatch(block.id, { text: e.target.value })}
            placeholder="Heading text"
            className={`${inputClass} font-serif text-lg`}
          />
          <div className="flex gap-2 text-xs">
            <SegToggle
              options={[
                { value: 2, label: "Large" },
                { value: 3, label: "Small" },
              ]}
              value={block.level ?? 2}
              onChange={(v) => onPatch(block.id, { level: v as 2 | 3 })}
            />
            <SegToggle
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
              ]}
              value={block.align ?? "left"}
              onChange={(v) => onPatch(block.id, { align: v as "left" | "center" })}
            />
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="grid gap-2">
          <textarea
            value={block.text}
            onChange={(e) => onPatch(block.id, { text: e.target.value })}
            rows={4}
            placeholder="Write your paragraph. Use **bold** for emphasis."
            className={`${inputClass} resize-y leading-relaxed`}
          />
          <SegToggle
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
            value={block.align ?? "left"}
            onChange={(v) => onPatch(block.id, { align: v as "left" | "center" })}
          />
        </div>
      );
    case "quote":
      return (
        <div className="grid gap-2">
          <textarea
            value={block.text}
            onChange={(e) => onPatch(block.id, { text: e.target.value })}
            rows={2}
            placeholder="Quote text"
            className={`${inputClass} resize-y font-serif text-lg`}
          />
          <input
            value={block.attribution ?? ""}
            onChange={(e) => onPatch(block.id, { attribution: e.target.value })}
            placeholder="Attribution (optional)"
            className={inputClass}
          />
        </div>
      );
    case "image":
      return (
        <div className="grid gap-2">
          <ImageSlot
            url={block.imageUrl ?? null}
            onFile={(f) => onImage(block.id, f)}
            aspect="aspect-[3/2]"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onPatch(block.id, { caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
          <input
            value={block.alt ?? ""}
            onChange={(e) => onPatch(block.id, { alt: e.target.value })}
            placeholder="Alt text (describe the photo)"
            className={inputClass}
          />
          <SegToggle
            options={[
              { value: "normal", label: "Normal" },
              { value: "full", label: "Wide" },
            ]}
            value={block.width ?? "normal"}
            onChange={(v) => onPatch(block.id, { width: v as "normal" | "full" })}
          />
        </div>
      );
    case "image_row":
      return (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((slot) => (
              <ImageSlot
                key={slot}
                url={block.images[slot]?.imageUrl ?? null}
                onFile={(f) => onImage(block.id, f, slot)}
                aspect="aspect-square"
                optional={slot === 2}
              />
            ))}
          </div>
          <input
            value={block.caption ?? ""}
            onChange={(e) => onPatch(block.id, { caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
        </div>
      );
    case "divider":
      return <div className="h-px bg-admin-ink/15" />;
  }
}

function ImageSlot({
  url,
  onFile,
  aspect,
  optional,
}: {
  url: string | null;
  onFile: (file: File | undefined) => void;
  aspect: string;
  optional?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={`relative ${aspect} overflow-hidden rounded-md border border-dashed border-admin-ink/20 bg-admin-ink/5 transition hover:border-admin-copper`}
    >
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          await onFile(f);
          setBusy(false);
        }}
      />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-admin-ink/40">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
          <span className="text-[10px]">{optional ? "Optional" : "Upload"}</span>
        </span>
      )}
    </button>
  );
}

function SegToggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-admin-ink/12">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            "min-h-8 px-3 text-xs transition " +
            (value === o.value ? "bg-admin-ink text-admin-surface" : "bg-white/60 text-admin-ink/60 hover:text-admin-ink")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Live preview (mirrors the public article styling) ─────────────── */

function previewInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

function Preview({
  title,
  date,
  excerpt,
  coverUrl,
  coverAlt,
  accentHex,
  bodyFont,
  blocks,
}: {
  title: string;
  date: string;
  excerpt: string;
  coverUrl: string;
  coverAlt: string;
  accentHex: string;
  bodyFont: string;
  blocks: JournalBlock[];
}) {
  const accent = accentHex || "#b98257";
  const fontClass = bodyFont === "sans" ? "font-sans" : "font-serif";
  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {coverUrl ? (
        <div className="relative h-40 w-full overflow-hidden bg-soft-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={coverAlt} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        </div>
      ) : null}
      <article className="px-6 py-8">
        <p className="text-xs text-soft-white/60">{formattedDate}</p>
        <h1 className="mt-2 font-serif text-2xl font-medium leading-tight tracking-tight">
          {title || "Untitled post"}
        </h1>
        {excerpt ? <p className="mt-2 text-sm leading-relaxed text-soft-white/60">{excerpt}</p> : null}

        <div className={`mt-6 border-t border-soft-white/10 pt-6 text-[15px] ${fontClass}`}>
          {blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} accent={accent} />
          ))}
        </div>
      </article>
    </div>
  );
}

function PreviewBlock({ block, accent }: { block: JournalBlock; accent: string }) {
  switch (block.type) {
    case "heading": {
      const align = block.align === "center" ? "text-center" : "";
      const size = block.level === 3 ? "text-xl" : "text-2xl";
      return (
        <h2 className={`mt-8 font-serif font-medium leading-tight tracking-tight first:mt-0 ${size} ${align}`}>
          {previewInline(block.text || "Heading")}
        </h2>
      );
    }
    case "paragraph": {
      const align = block.align === "center" ? "text-center" : "";
      return (
        <p className={`mt-4 leading-[1.8] text-soft-white/75 first:mt-0 ${align}`}>
          {block.text ? previewInline(block.text) : <span className="text-soft-white/30">Empty paragraph</span>}
        </p>
      );
    }
    case "quote":
      return (
        <figure className="my-7 border-l-2 pl-4 first:mt-0" style={{ borderColor: accent }}>
          <blockquote className="font-serif text-lg leading-snug text-soft-white/90">{block.text || "Quote"}</blockquote>
          {block.attribution ? (
            <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-soft-white/55">{block.attribution}</figcaption>
          ) : null}
        </figure>
      );
    case "image": {
      const full = block.width === "full";
      return (
        <figure className={`my-6 first:mt-0 ${full ? "-mx-6" : ""}`}>
          <div className="relative aspect-[3/2] overflow-hidden rounded-[2px] bg-soft-white/8">
            {block.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.imageUrl} alt={block.alt ?? ""} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-soft-white/25">No photo yet</span>
            )}
          </div>
          {block.caption ? (
            <figcaption className="mt-2 text-center text-xs italic text-soft-white/55">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    }
    case "image_row": {
      const shown = block.images.filter((im) => im.imageUrl);
      return (
        <figure className="my-6 first:mt-0">
          <div className="grid grid-cols-2 gap-2">
            {(shown.length ? shown : block.images.slice(0, 2)).map((im, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-[2px] bg-soft-white/8">
                {im.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={im.imageUrl} alt={im.alt ?? ""} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-[10px] text-soft-white/25">Photo</span>
                )}
              </div>
            ))}
          </div>
          {block.caption ? (
            <figcaption className="mt-2 text-center text-xs italic text-soft-white/55">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    }
    case "divider":
      return <hr className="my-8 border-soft-white/12" />;
  }
}
