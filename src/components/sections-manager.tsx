"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { PageBlock, BlockType } from "@/lib/page-blocks";
import {
  addBlock,
  deleteBlock,
  moveBlock,
  toggleBlockHidden,
  updateBlock,
} from "@/app/admin/(protected)/sections/actions";

const inputClass =
  "min-h-10 w-full rounded-md border border-[#17130f]/12 bg-white/70 px-3 text-sm text-[#17130f] outline-none transition focus:border-[#b98257]";
const textareaClass =
  "min-h-20 w-full rounded-md border border-[#17130f]/12 bg-white/70 px-3 py-2 text-sm text-[#17130f] outline-none focus:border-[#b98257]";
const labelClass = "grid gap-1 text-xs font-medium text-[#17130f]";

const TYPE_FIELDS: Record<BlockType, { key: string; label: string; multiline?: boolean }[]> = {
  text: [
    { key: "eyebrow", label: "Eyebrow (small label)" },
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", multiline: true },
  ],
  cta: [
    { key: "heading", label: "Heading" },
    { key: "buttonLabel", label: "Button label" },
    { key: "buttonHref", label: "Button link (e.g. /contact)" },
  ],
  image: [
    { key: "imageUrl", label: "Image URL" },
    { key: "alt", label: "Alt text" },
    { key: "caption", label: "Caption (optional)" },
  ],
  gallery_strip: [{ key: "heading", label: "Heading (optional)" }],
};

const BLOCK_ORDER: BlockType[] = ["text", "cta", "image", "gallery_strip"];

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Text block",
  image: "Image",
  cta: "Call to action",
  gallery_strip: "Featured photos strip",
};

function summary(block: PageBlock): string {
  const c = block.content ?? {};
  const heading = typeof c.heading === "string" ? c.heading : "";
  const eyebrow = typeof c.eyebrow === "string" ? c.eyebrow : "";
  const imageUrl = typeof c.imageUrl === "string" ? c.imageUrl : "";
  return heading || eyebrow || imageUrl || "Empty — click Edit to add content";
}

export function SectionsManager({
  initialBlocks,
  pageSlug = "home",
}: {
  initialBlocks: PageBlock[];
  pageSlug?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addType, setAddType] = useState<BlockType>("text");
  const [editingId, setEditingId] = useState<string | null>(null);

  const blocks = initialBlocks;

  const run = (form: FormData, action: (fd: FormData) => Promise<void>) => {
    startTransition(async () => {
      await action(form);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Add */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#9b744f]/30 bg-[#b98257]/10 p-4">
        <span className="text-sm font-medium text-[#17130f]">Add a section</span>
        <select
          className={`${inputClass} max-w-xs`}
          value={addType}
          onChange={(e) => setAddType(e.target.value as BlockType)}
        >
          {BLOCK_ORDER.map((t) => (
            <option key={t} value={t}>
              {BLOCK_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <form
          action={(fd) => {
            run(fd, addBlock);
          }}
        >
          <input type="hidden" name="page_slug" value={pageSlug} />
          <input type="hidden" name="block_type" value={addType} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-[#17130f] px-4 py-2 text-sm font-medium text-[#fbf8f1] disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </button>
        </form>
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#17130f]/15 bg-[#fbf8f1] p-8 text-center text-sm text-[#17130f]/55">
          No custom sections yet. Add one above — it appears near the bottom of the homepage.
        </p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((block, index) => (
            <li key={block.id} className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1]">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#17130f]/8 px-2.5 py-0.5 text-xs font-medium text-[#17130f]/70">
                      {BLOCK_TYPE_LABELS[block.block_type]}
                    </span>
                    {block.is_hidden && (
                      <span className="rounded-full bg-[#17130f]/80 px-2 py-0.5 text-[10px] font-medium text-white">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-sm text-[#17130f]/70">{summary(block)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === block.id ? null : block.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#17130f]/10 px-2 py-1 text-[11px] text-[#17130f]/70 hover:bg-[#17130f] hover:text-[#fbf8f1]"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    {editingId === block.id ? "Close" : "Edit"}
                  </button>
                  <form action={(fd) => run(fd, moveBlock)}>
                    <input type="hidden" name="id" value={block.id} />
                    <input type="hidden" name="page_slug" value={pageSlug} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={pending || index === 0} title="Move up" className="inline-flex rounded-md border border-[#17130f]/10 px-2 py-1 text-[11px] text-[#17130f]/70 hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:opacity-40">
                      <ArrowUp className="size-3" aria-hidden="true" />
                    </button>
                  </form>
                  <form action={(fd) => run(fd, moveBlock)}>
                    <input type="hidden" name="id" value={block.id} />
                    <input type="hidden" name="page_slug" value={pageSlug} />
                    <input type="hidden" name="direction" value="down" />
                    <button type="submit" disabled={pending || index === blocks.length - 1} title="Move down" className="inline-flex rounded-md border border-[#17130f]/10 px-2 py-1 text-[11px] text-[#17130f]/70 hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:opacity-40">
                      <ArrowDown className="size-3" aria-hidden="true" />
                    </button>
                  </form>
                  <form action={(fd) => run(fd, toggleBlockHidden)}>
                    <input type="hidden" name="id" value={block.id} />
                    <input type="hidden" name="page_slug" value={pageSlug} />
                    <input type="hidden" name="next" value={String(!block.is_hidden)} />
                    <button type="submit" disabled={pending} className="inline-flex items-center gap-1 rounded-md border border-[#17130f]/10 px-2 py-1 text-[11px] text-[#17130f]/70 hover:bg-[#17130f] hover:text-[#fbf8f1] disabled:opacity-40">
                      {block.is_hidden ? <Eye className="size-3" aria-hidden="true" /> : <EyeOff className="size-3" aria-hidden="true" />}
                      {block.is_hidden ? "Show" : "Hide"}
                    </button>
                  </form>
                  <form
                    action={(fd) => {
                      if (!window.confirm("Delete this section?")) return;
                      run(fd, deleteBlock);
                    }}
                  >
                    <input type="hidden" name="id" value={block.id} />
                    <input type="hidden" name="page_slug" value={pageSlug} />
                    <button type="submit" disabled={pending} className="inline-flex items-center rounded-md border border-[#8a2f24]/20 px-2 py-1 text-[11px] text-[#8a2f24] hover:bg-[#8a2f24] hover:text-white disabled:opacity-40">
                      <Trash2 className="size-3" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>

              {editingId === block.id && (
                <form
                  action={(fd) => {
                    run(fd, updateBlock);
                    setEditingId(null);
                  }}
                  className="grid gap-3 border-t border-[#17130f]/10 bg-white/40 p-4"
                >
                  <input type="hidden" name="id" value={block.id} />
                  <input type="hidden" name="page_slug" value={pageSlug} />
                  <input type="hidden" name="block_type" value={block.block_type} />
                  {TYPE_FIELDS[block.block_type].map((field) => {
                    const current =
                      typeof block.content?.[field.key] === "string"
                        ? (block.content[field.key] as string)
                        : "";
                    return (
                      <label key={field.key} className={labelClass}>
                        {field.label}
                        {field.multiline ? (
                          <textarea className={textareaClass} name={field.key} defaultValue={current} />
                        ) : (
                          <input className={inputClass} name={field.key} defaultValue={current} />
                        )}
                      </label>
                    );
                  })}
                  {block.block_type === "gallery_strip" && (
                    <p className="text-xs text-[#17130f]/50">
                      Shows up to 6 of your featured portfolio photos. Mark photos as featured in the
                      Portfolio manager.
                    </p>
                  )}
                  <div>
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex items-center gap-2 rounded-md bg-[#17130f] px-4 py-2 text-sm font-medium text-[#fbf8f1] disabled:opacity-50"
                    >
                      Save section
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
