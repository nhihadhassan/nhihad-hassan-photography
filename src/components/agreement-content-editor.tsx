"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { AgreementSection } from "@/data/booking-agreement";
import type { BookingAgreementContent } from "@/lib/booking-agreement";
import { saveBookingAgreement } from "@/app/admin/(protected)/booking-agreement/actions";

const inputClass =
  "w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none transition focus:border-admin-copper";

type EditorSection = { heading: string; clausesText: string };

function toEditor(sections: AgreementSection[]): EditorSection[] {
  return sections.map((s) => ({ heading: s.heading, clausesText: s.clauses.join("\n") }));
}

function toPayload(sections: EditorSection[]): AgreementSection[] {
  return sections.map((s) => ({
    heading: s.heading.trim(),
    clauses: s.clausesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  }));
}

export function AgreementContentEditor({ content }: { content: BookingAgreementContent }) {
  const [saving, startSaving] = useTransition();
  const [intro, setIntro] = useState(content.intro);
  const [disclaimer, setDisclaimer] = useState(content.disclaimer);
  const [sections, setSections] = useState<EditorSection[]>(toEditor(content.sections));
  const [saved, setSaved] = useState(false);

  const patch = (i: number, key: keyof EditorSection, value: string) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));

  const move = (i: number, dir: "up" | "down") =>
    setSections((prev) => {
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setSections((prev) => [...prev, { heading: "", clausesText: "" }]);

  const handleSave = () => {
    const fd = new FormData();
    fd.set("intro", intro);
    fd.set("disclaimer", disclaimer);
    fd.set("sections", JSON.stringify(toPayload(sections)));
    setSaved(false);
    startSaving(async () => {
      await saveBookingAgreement(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-admin-ink/55">
          Edit the contract clients see at{" "}
          <Link
            href="/booking-agreement"
            target="_blank"
            className="inline-flex items-center gap-1 text-admin-accent hover:text-admin-ink"
          >
            /booking-agreement <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
          . One clause per line within each section.
        </p>
        <div className="flex items-center gap-3">
          {saved ? <span className="text-sm text-admin-success">Saved</span> : null}
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

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Intro paragraph</span>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Disclaimer note</span>
        <textarea
          value={disclaimer}
          onChange={(e) => setDisclaimer(e.target.value)}
          rows={2}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={section.heading}
                onChange={(e) => patch(i, "heading", e.target.value)}
                placeholder="Section heading"
                className={`${inputClass} font-medium`}
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, "up")}
                  disabled={i === 0}
                  className="rounded p-1.5 text-admin-ink/55 hover:bg-admin-ink/6 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, "down")}
                  disabled={i === sections.length - 1}
                  className="rounded p-1.5 text-admin-ink/55 hover:bg-admin-ink/6 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded p-1.5 text-admin-danger/80 hover:bg-admin-danger/5"
                  aria-label="Delete section"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <textarea
              value={section.clausesText}
              onChange={(e) => patch(i, "clausesText", e.target.value)}
              rows={Math.max(3, section.clausesText.split("\n").length)}
              placeholder="One clause per line."
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/15 px-4 text-sm font-medium text-admin-ink/75 transition hover:border-admin-copper hover:text-admin-ink"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add section
      </button>
    </div>
  );
}
