"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import type { PricingCategory } from "@/data/pricing";
import { pricingCategories as defaultCategories } from "@/data/pricing";
import { savePricing } from "@/app/admin/(protected)/pricing/actions";

const inputClass =
  "w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none transition focus:border-admin-copper";

type Tier = { name: string; price: string; duration: string; includesText: string; details: string };
type Category = { label: string; blurb: string; note: string; tiers: Tier[] };

function toEditor(cats: PricingCategory[]): Category[] {
  return cats.map((c) => ({
    label: c.label,
    blurb: c.blurb,
    note: c.note ?? "",
    tiers: c.tiers.map((t) => ({
      name: t.name,
      price: t.price,
      duration: t.duration,
      includesText: t.includes.join("\n"),
      details: t.details ?? "",
    })),
  }));
}

function toPayload(cats: Category[]) {
  return cats.map((c) => ({
    label: c.label.trim(),
    blurb: c.blurb.trim(),
    note: c.note.trim(),
    tiers: c.tiers.map((t) => ({
      name: t.name.trim(),
      price: t.price.trim(),
      duration: t.duration.trim(),
      includes: t.includesText.split("\n").map((l) => l.trim()).filter(Boolean),
      details: t.details.trim(),
    })),
  }));
}

function iconBtn(extra = "") {
  return `rounded p-1.5 text-admin-ink/55 transition hover:bg-admin-ink/6 disabled:opacity-30 ${extra}`;
}

function move<T>(arr: T[], i: number, dir: "up" | "down"): T[] {
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function PricingEditor({ content }: { content: PricingCategory[] }) {
  const [saving, startSaving] = useTransition();
  const [cats, setCats] = useState<Category[]>(toEditor(content));
  const [saved, setSaved] = useState(false);

  const patchCat = (ci: number, patch: Partial<Category>) =>
    setCats((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const patchTier = (ci: number, ti: number, patch: Partial<Tier>) =>
    setCats((prev) =>
      prev.map((c, i) => (i === ci ? { ...c, tiers: c.tiers.map((t, j) => (j === ti ? { ...t, ...patch } : t)) } : c)),
    );

  const addCategory = () =>
    setCats((prev) => [...prev, { label: "", blurb: "", note: "", tiers: [{ name: "", price: "", duration: "", includesText: "", details: "" }] }]);
  const removeCategory = (ci: number) => setCats((prev) => prev.filter((_, i) => i !== ci));
  const moveCategory = (ci: number, dir: "up" | "down") => setCats((prev) => move(prev, ci, dir));

  const addTier = (ci: number) =>
    setCats((prev) => prev.map((c, i) => (i === ci ? { ...c, tiers: [...c.tiers, { name: "", price: "", duration: "", includesText: "", details: "" }] } : c)));
  const removeTier = (ci: number, ti: number) =>
    setCats((prev) => prev.map((c, i) => (i === ci ? { ...c, tiers: c.tiers.filter((_, j) => j !== ti) } : c)));
  const moveTier = (ci: number, ti: number, dir: "up" | "down") =>
    setCats((prev) => prev.map((c, i) => (i === ci ? { ...c, tiers: move(c.tiers, ti, dir) } : c)));

  const restore = () => {
    if (!window.confirm("Replace all pricing with the original defaults? Your current text will be lost.")) return;
    setCats(toEditor(defaultCategories));
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.set("categories", JSON.stringify(toPayload(cats)));
    setSaved(false);
    startSaving(async () => {
      await savePricing(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-[57px] z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-ink/10 bg-admin-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className="text-sm text-admin-ink/55">
          Live at{" "}
          <Link href="/pricing" target="_blank" className="inline-flex items-center gap-1 text-admin-accent hover:text-admin-ink">
            /pricing <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        </p>
        <div className="flex items-center gap-3">
          {saved ? <span className="text-sm text-admin-success">Saved</span> : null}
          <button type="button" onClick={restore} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/15 px-3 text-sm text-admin-ink/65 transition hover:text-admin-ink">
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restore defaults
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50">
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {cats.map((cat, ci) => (
          <div key={ci} className="rounded-lg border border-admin-ink/12 bg-admin-surface p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-admin-ink/40">Category {ci + 1}</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => moveCategory(ci, "up")} disabled={ci === 0} className={iconBtn()} aria-label="Move category up"><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => moveCategory(ci, "down")} disabled={ci === cats.length - 1} className={iconBtn()} aria-label="Move category down"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => removeCategory(ci)} className={iconBtn("text-admin-danger/80 hover:bg-admin-danger/5")} aria-label="Delete category"><Trash2 className="size-4" /></button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input value={cat.label} onChange={(e) => patchCat(ci, { label: e.target.value })} placeholder="Category name (e.g. Weddings)" className={`${inputClass} font-medium`} />
              <input value={cat.note} onChange={(e) => patchCat(ci, { note: e.target.value })} placeholder="Optional note (shown beside the heading)" className={inputClass} />
            </div>
            <textarea value={cat.blurb} onChange={(e) => patchCat(ci, { blurb: e.target.value })} rows={2} placeholder="Short blurb under the category name" className={`${inputClass} mt-3 resize-y`} />

            {/* Tiers */}
            <div className="mt-4 space-y-3 border-t border-admin-ink/10 pt-4">
              {cat.tiers.map((tier, ti) => (
                <div key={ti} className="rounded-md border border-admin-ink/10 bg-white/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-admin-ink/40">Tier {ti + 1}</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => moveTier(ci, ti, "up")} disabled={ti === 0} className={iconBtn()} aria-label="Move tier up"><ArrowUp className="size-3.5" /></button>
                      <button type="button" onClick={() => moveTier(ci, ti, "down")} disabled={ti === cat.tiers.length - 1} className={iconBtn()} aria-label="Move tier down"><ArrowDown className="size-3.5" /></button>
                      <button type="button" onClick={() => removeTier(ci, ti)} className={iconBtn("text-admin-danger/80 hover:bg-admin-danger/5")} aria-label="Delete tier"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <input value={tier.name} onChange={(e) => patchTier(ci, ti, { name: e.target.value })} placeholder="Tier name" className={inputClass} />
                    <input value={tier.price} onChange={(e) => patchTier(ci, ti, { price: e.target.value })} placeholder="Price (e.g. $500–$700)" className={inputClass} />
                    <input value={tier.duration} onChange={(e) => patchTier(ci, ti, { duration: e.target.value })} placeholder="Duration (e.g. 4–5 hours)" className={inputClass} />
                  </div>
                  <textarea value={tier.includesText} onChange={(e) => patchTier(ci, ti, { includesText: e.target.value })} rows={Math.max(3, tier.includesText.split("\n").length)} placeholder="What's included, one item per line" className={`${inputClass} mt-2 resize-y`} />
                  <textarea value={tier.details} onChange={(e) => patchTier(ci, ti, { details: e.target.value })} rows={2} placeholder="Extra detail shown on hover/tap (optional)" className={`${inputClass} mt-2 resize-y`} />
                </div>
              ))}
              <button type="button" onClick={() => addTier(ci)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:border-admin-copper hover:text-admin-ink">
                <Plus className="size-3.5" aria-hidden="true" />
                Add tier
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addCategory} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/15 px-4 text-sm font-medium text-admin-ink/75 transition hover:border-admin-copper hover:text-admin-ink">
        <Plus className="size-4" aria-hidden="true" />
        Add category
      </button>
    </div>
  );
}
