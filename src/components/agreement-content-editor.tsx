"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import type { AgreementSection } from "@/data/booking-agreement";
import {
  agreementDisclaimer as defaultDisclaimer,
  agreementIntro as defaultIntro,
  agreementSections as defaultSections,
} from "@/data/booking-agreement";
import type { BookingAgreementContent } from "@/lib/booking-agreement";
import { saveBookingAgreement } from "@/app/admin/(protected)/booking-agreement/actions";

const inputClass =
  "w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none transition focus:border-admin-copper";

type Section = { heading: string; clauses: string[] };

function clone(sections: AgreementSection[]): Section[] {
  return sections.map((s) => ({ heading: s.heading, clauses: [...s.clauses] }));
}

function iconBtn(extra = "") {
  return `rounded p-1.5 text-admin-ink/55 transition hover:bg-admin-ink/6 disabled:opacity-30 ${extra}`;
}

export function AgreementContentEditor({ content }: { content: BookingAgreementContent }) {
  const [saving, startSaving] = useTransition();
  const [intro, setIntro] = useState(content.intro);
  const [disclaimer, setDisclaimer] = useState(content.disclaimer);
  const [sections, setSections] = useState<Section[]>(clone(content.sections));
  const [saved, setSaved] = useState(false);

  const setSection = (i: number, next: Partial<Section>) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...next } : s)));

  const moveSection = (i: number, dir: "up" | "down") =>
    setSections((prev) => {
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));
  const addSection = () => setSections((prev) => [...prev, { heading: "", clauses: [""] }]);

  const setClause = (si: number, ci: number, value: string) =>
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === si ? { ...s, clauses: s.clauses.map((c, cj) => (cj === ci ? value : c)) } : s,
      ),
    );

  const moveClause = (si: number, ci: number, dir: "up" | "down") =>
    setSections((prev) =>
      prev.map((s, idx) => {
        if (idx !== si) return s;
        const j = dir === "up" ? ci - 1 : ci + 1;
        if (j < 0 || j >= s.clauses.length) return s;
        const clauses = [...s.clauses];
        [clauses[ci], clauses[j]] = [clauses[j], clauses[ci]];
        return { ...s, clauses };
      }),
    );

  const removeClause = (si: number, ci: number) =>
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === si ? { ...s, clauses: s.clauses.filter((_, cj) => cj !== ci) } : s,
      ),
    );

  const addClause = (si: number) =>
    setSections((prev) =>
      prev.map((s, idx) => (idx === si ? { ...s, clauses: [...s.clauses, ""] } : s)),
    );

  const restoreDefaults = () => {
    if (!window.confirm("Replace everything with the original wording? Your current text will be lost.")) {
      return;
    }
    setIntro(defaultIntro);
    setDisclaimer(defaultDisclaimer);
    setSections(clone(defaultSections));
  };

  const handleSave = () => {
    const cleaned: Section[] = sections
      .map((s) => ({
        heading: s.heading.trim(),
        clauses: s.clauses.map((c) => c.trim()).filter(Boolean),
      }))
      .filter((s) => s.heading || s.clauses.length);

    const fd = new FormData();
    fd.set("intro", intro);
    fd.set("disclaimer", disclaimer);
    fd.set("sections", JSON.stringify(cleaned));
    setSaved(false);
    startSaving(async () => {
      await saveBookingAgreement(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Sticky action bar */}
      <div className="sticky top-[57px] z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-ink/10 bg-admin-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className="text-sm text-admin-ink/55">
          Live at{" "}
          <Link
            href="/booking-agreement"
            target="_blank"
            className="inline-flex items-center gap-1 text-admin-accent hover:text-admin-ink"
          >
            /booking-agreement <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        </p>
        <div className="flex items-center gap-3">
          {saved ? <span className="text-sm text-admin-success">Saved</span> : null}
          <button
            type="button"
            onClick={restoreDefaults}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/15 px-3 text-sm text-admin-ink/65 transition hover:text-admin-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restore default wording
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

      <p className="rounded-md border border-admin-ink/10 bg-admin-surface px-4 py-3 text-sm leading-6 text-admin-ink/65">
        Each box below is one paragraph of the contract. Use <strong>Add clause</strong> to add a new
        paragraph, the arrows to reorder, and the trash icon to remove. Client and shoot details
        (names, dates, totals) are filled in per client and are not edited here.
      </p>

      {/* Intro + disclaimer */}
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Opening paragraph</span>
        <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} className={`${inputClass} resize-y leading-relaxed`} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Disclaimer note</span>
        <textarea value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} rows={2} className={`${inputClass} resize-y leading-relaxed`} />
      </label>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((section, si) => (
          <div key={si} className="rounded-lg border border-admin-ink/12 bg-admin-surface p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-admin-ink/40">
                Section {si + 1}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => moveSection(si, "up")} disabled={si === 0} className={iconBtn()} aria-label="Move section up">
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => moveSection(si, "down")} disabled={si === sections.length - 1} className={iconBtn()} aria-label="Move section down">
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => removeSection(si)} className={iconBtn("text-admin-danger/80 hover:bg-admin-danger/5")} aria-label="Delete section">
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <input
              value={section.heading}
              onChange={(e) => setSection(si, { heading: e.target.value })}
              placeholder="Section heading (e.g. Booking and deposit)"
              className={`${inputClass} mt-3 font-medium`}
            />

            <div className="mt-3 space-y-2.5">
              {section.clauses.map((clause, ci) => (
                <div key={ci} className="flex items-start gap-2">
                  <textarea
                    value={clause}
                    onChange={(e) => setClause(si, ci, e.target.value)}
                    rows={2}
                    placeholder="One paragraph of this section."
                    className={`${inputClass} resize-y leading-relaxed`}
                  />
                  <div className="flex shrink-0 flex-col gap-1 pt-1">
                    <button type="button" onClick={() => moveClause(si, ci, "up")} disabled={ci === 0} className={iconBtn()} aria-label="Move clause up">
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => moveClause(si, ci, "down")} disabled={ci === section.clauses.length - 1} className={iconBtn()} aria-label="Move clause down">
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => removeClause(si, ci)} className={iconBtn("text-admin-danger/80 hover:bg-admin-danger/5")} aria-label="Delete clause">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addClause(si)}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:border-admin-copper hover:text-admin-ink"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add clause
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSection}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/15 px-4 text-sm font-medium text-admin-ink/75 transition hover:border-admin-copper hover:text-admin-ink"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add section
      </button>
    </div>
  );
}
