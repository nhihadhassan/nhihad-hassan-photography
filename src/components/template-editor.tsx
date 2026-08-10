"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { AgreementDocument } from "@/components/agreement-document";
import type { ContractTemplate } from "@/lib/contract-templates";
import { templateVariables, templateVariableGroups, sampleVariableValues } from "@/lib/contract-template-variables";
import {
  archiveTemplateAction,
  duplicateTemplateAction,
  renameTemplateAction,
  saveTemplateAction,
} from "@/app/admin/(protected)/templates/actions";

type Section = { heading: string; clauses: string[] };
type SaveState = "idle" | "saving" | "saved" | "error";
const AUTOSAVE_DELAY_MS = 1500;

function clone(sections: Section[]): Section[] {
  return sections.map((s) => ({ heading: s.heading, clauses: [...s.clauses] }));
}

const fieldClass =
  "w-full resize-none rounded-sm border border-transparent bg-transparent p-1 -m-1 outline-none transition focus:border-admin-copper/50 focus:bg-white/70";

export function TemplateEditor({ template }: { template: ContractTemplate }) {
  const router = useRouter();
  const [saving, startTransition] = useTransition();
  const [pendingAction, startActionTransition] = useTransition();

  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [agreementTitle, setAgreementTitle] = useState(template.agreementTitle);
  const [intro, setIntro] = useState(template.intro);
  const [sections, setSections] = useState<Section[]>(clone(template.sections));
  const [supportsSecondSigner, setSupportsSecondSigner] = useState(template.supportsSecondSigner);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [variableMenuOpen, setVariableMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const focusedFieldRef = useRef<{ id: string; el: HTMLTextAreaElement | HTMLInputElement } | null>(null);
  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    startTransition(async () => {
      const cleanedSections = sections
        .map((s) => ({ heading: s.heading.trim(), clauses: s.clauses.map((c) => c.trim()).filter(Boolean) }))
        .filter((s) => s.heading || s.clauses.length);
      const result = await saveTemplateAction(template.id, {
        name: name.trim() || template.name,
        description: description.trim(),
        agreementTitle: agreementTitle.trim() || template.agreementTitle,
        intro,
        sections: cleanedSections,
        supportsSecondSigner,
      });
      setSaveState(result.ok ? "saved" : "error");
      dirtyRef.current = false;
    });
  }, [sections, name, description, agreementTitle, intro, supportsSecondSigner, template.id, template.name, template.agreementTitle]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  }, [save]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Save on the way out if something is still pending.
  useEffect(() => {
    const handler = () => {
      if (dirtyRef.current) save();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [save]);

  const setSection = (i: number, next: Partial<Section>) => {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...next } : s)));
    scheduleSave();
  };
  const moveSection = (i: number, dir: "up" | "down") => {
    setSections((prev) => {
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    scheduleSave();
  };
  const removeSection = (i: number) => {
    setSections((prev) => prev.filter((_, idx) => idx !== i));
    scheduleSave();
  };
  const addSection = () => {
    setSections((prev) => [...prev, { heading: `${prev.length + 1}. New section`, clauses: ["New paragraph."] }]);
    scheduleSave();
  };
  const setClause = (si: number, ci: number, value: string) => {
    setSections((prev) =>
      prev.map((s, idx) => (idx === si ? { ...s, clauses: s.clauses.map((c, cj) => (cj === ci ? value : c)) } : s)),
    );
    scheduleSave();
  };
  const moveClause = (si: number, ci: number, dir: "up" | "down") => {
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
    scheduleSave();
  };
  const removeClause = (si: number, ci: number) => {
    setSections((prev) => prev.map((s, idx) => (idx === si ? { ...s, clauses: s.clauses.filter((_, cj) => cj !== ci) } : s)));
    scheduleSave();
  };
  const addClause = (si: number) => {
    setSections((prev) => prev.map((s, idx) => (idx === si ? { ...s, clauses: [...s.clauses, "New paragraph."] } : s)));
    scheduleSave();
  };

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    const focused = focusedFieldRef.current;
    if (!focused) {
      // No field focused: append to the intro as a safe default landing spot.
      setIntro((prev) => `${prev} ${token}`);
      scheduleSave();
      setVariableMenuOpen(false);
      return;
    }
    const { id, el } = focused;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const nextValue = el.value.slice(0, start) + token + el.value.slice(end);

    if (id === "intro") {
      setIntro(nextValue);
    } else {
      const match = id.match(/^section-(\d+)-(heading|clause-(\d+))$/);
      if (match) {
        const si = Number(match[1]);
        if (match[2] === "heading") {
          setSection(si, { heading: nextValue });
        } else {
          const ci = Number(match[3]);
          setClause(si, ci, nextValue);
        }
      }
    }
    scheduleSave();
    setVariableMenuOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const registerField = (id: string) => (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    if (el) {
      const onFocus = () => {
        focusedFieldRef.current = { id, el };
      };
      el.onfocus = onFocus;
    }
  };

  const previewValues = useMemo(() => sampleVariableValues, []);

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save" : saveState === "saved" ? "Saved" : "";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Toolbar */}
      <div className="sticky top-[57px] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-ink/10 bg-admin-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/templates"
            className="inline-flex items-center gap-1.5 text-sm text-admin-ink/60 transition hover:text-admin-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Contract Templates
          </Link>
          <span className="text-admin-ink/20">/</span>
          <div className="min-w-0">
            <p className="truncate font-medium text-admin-ink">{name || "Untitled template"}</p>
            <p className="text-xs text-admin-ink/45">Template{saveLabel ? ` · ${saveLabel}` : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-pressed={sidebarOpen}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${
              sidebarOpen
                ? "border-admin-copper bg-admin-copper/10 text-admin-ink"
                : "border-admin-ink/15 text-admin-ink/70 hover:bg-admin-ink/6"
            }`}
          >
            <Settings2 className="size-3.5" aria-hidden="true" />
            Settings
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode((v) => !v)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
          >
            {previewMode ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
            {previewMode ? "Back to editing" : "Preview"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-admin-ink px-3 text-xs font-medium text-admin-surface disabled:opacity-50"
          >
            <Save className="size-3.5" aria-hidden="true" />
            Save
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More actions"
              className="inline-flex size-9 items-center justify-center rounded-md border border-admin-ink/15 text-admin-ink/70 transition hover:bg-admin-ink/6"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-30 mt-1 w-44 rounded-md border border-admin-ink/10 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    startActionTransition(async () => {
                      const result = await duplicateTemplateAction(template.id);
                      if (result.ok && result.id) router.push(`/admin/templates/${result.id}`);
                      else setFeedback(result.message);
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-admin-ink/80 hover:bg-admin-ink/6"
                >
                  <Copy className="size-3.5" aria-hidden="true" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    const next = window.prompt("Rename template", name);
                    if (!next) return;
                    setName(next);
                    startActionTransition(async () => {
                      const result = await renameTemplateAction(template.id, next);
                      setFeedback(result.message);
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-admin-ink/80 hover:bg-admin-ink/6"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (!window.confirm(`Archive "${name}"? It will no longer be offered when creating agreements.`)) return;
                    startActionTransition(async () => {
                      const result = await archiveTemplateAction(template.id);
                      if (result.ok) router.push("/admin/templates");
                      else setFeedback(result.message);
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-admin-danger hover:bg-admin-danger/5"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Archive
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {feedback ? (
        <p className="mt-3 rounded-md bg-admin-danger/8 px-3 py-2 text-sm text-admin-danger">{feedback}</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Document surface */}
        <div className="min-w-0">
          {!previewMode ? (
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-admin-ink/50">
                Click any line of the contract to edit it directly.
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setVariableMenuOpen((v) => !v)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:border-admin-copper hover:text-admin-ink"
                >
                  Insert variable
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
                {variableMenuOpen ? (
                  <div className="absolute right-0 z-30 mt-1 max-h-96 w-64 overflow-y-auto rounded-md border border-admin-ink/10 bg-white py-1 shadow-lg">
                    {templateVariableGroups.map((group) => (
                      <div key={group}>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-admin-ink/40">
                          {group}
                        </p>
                        {templateVariables
                          .filter((v) => v.group === group)
                          .map((v) => (
                            <button
                              key={v.key}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => insertVariable(v.key)}
                              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-admin-ink/80 hover:bg-admin-ink/6"
                            >
                              {v.label}
                              <code className="text-[10px] text-admin-accent">{`{{${v.key}}}`}</code>
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mb-4 rounded-md border border-admin-copper/25 bg-admin-copper/8 px-4 py-2.5 text-sm text-admin-ink/75">
              Previewing with sample data. Nothing here is saved.
            </p>
          )}

          <div className="overflow-hidden rounded-md border border-admin-ink/10 bg-[#fbfaf7] shadow-[0_8px_28px_rgba(23,19,15,0.08)]">
            {previewMode ? (
              <AgreementDocument
                title={agreementTitle}
                intro={intro}
                sections={sections}
                detailRows={[]}
                agreementValues={previewValues}
                referenceFormatting
                signatureSlot={<SignaturePlaceholder supportsSecondSigner={supportsSecondSigner} />}
              />
            ) : (
              <EditableDocument
                title={agreementTitle}
                intro={intro}
                sections={sections}
                registerField={registerField}
                onIntroChange={(v) => {
                  setIntro(v);
                  scheduleSave();
                }}
                onSectionHeading={(si, v) => setSection(si, { heading: v })}
                onClauseChange={setClause}
                onMoveSection={moveSection}
                onRemoveSection={removeSection}
                onAddSection={addSection}
                onMoveClause={moveClause}
                onRemoveClause={removeClause}
                onAddClause={addClause}
                supportsSecondSigner={supportsSecondSigner}
              />
            )}
          </div>
        </div>

        {/* Settings sidebar */}
        {sidebarOpen ? (
          <aside className="h-fit rounded-md border border-admin-ink/10 bg-admin-surface p-4 lg:sticky lg:top-[140px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-admin-ink/50">Template settings</p>
            <div className="mt-3 space-y-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Template name</span>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    scheduleSave();
                  }}
                  className="min-h-10 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none focus:border-admin-copper"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    scheduleSave();
                  }}
                  rows={2}
                  placeholder="Shown in the templates list"
                  className="resize-y rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none focus:border-admin-copper"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Agreement title</span>
                <input
                  value={agreementTitle}
                  onChange={(e) => {
                    setAgreementTitle(e.target.value);
                    scheduleSave();
                  }}
                  className="min-h-10 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none focus:border-admin-copper"
                />
              </label>
              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={supportsSecondSigner}
                  onChange={(e) => {
                    setSupportsSecondSigner(e.target.checked);
                    scheduleSave();
                  }}
                  className="mt-0.5 size-4 accent-admin-copper"
                />
                <span className="text-admin-ink/75">
                  Supports a second signer
                  <span className="mt-0.5 block text-xs text-admin-ink/50">
                    Offers {"{{secondSignerName}}"} and related fields when this template is used.
                  </span>
                </span>
              </label>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** Static placeholder shown only inside the editor/preview. The real agreement page uses the actual signing UI and the real signature.png block — this never appears there. */
function SignaturePlaceholder({ supportsSecondSigner }: { supportsSecondSigner: boolean }) {
  return (
    <section className="mt-14 break-inside-avoid">
      <h2 className="font-serif text-2xl text-ink">Signatures</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="border border-dashed border-ink/25 bg-ink/[0.02] p-4 text-center text-sm text-ink/45">
          Client signature area
        </div>
        {supportsSecondSigner ? (
          <div className="border border-dashed border-ink/25 bg-ink/[0.02] p-4 text-center text-sm text-ink/45">
            Second client signature area
          </div>
        ) : null}
      </div>
      <div className="mt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Photographer</p>
        <div className="mt-2 max-w-[220px] border border-dashed border-ink/25 bg-ink/[0.02] p-4 text-center text-xs text-ink/45">
          Built-in photographer signature
        </div>
      </div>
    </section>
  );
}

/**
 * Document-first edit surface. Visually mirrors AgreementDocument's
 * typography (reference-formatting variant) so switching to Preview doesn't
 * jump, but uses editable fields instead of static text — kept as a
 * separate, simpler surface rather than threading editable-vs-static render
 * props through the component that also renders every real signed
 * agreement and every PDF.
 */
function EditableDocument({
  title,
  intro,
  sections,
  registerField,
  onIntroChange,
  onSectionHeading,
  onClauseChange,
  onMoveSection,
  onRemoveSection,
  onAddSection,
  onMoveClause,
  onRemoveClause,
  onAddClause,
  supportsSecondSigner,
}: {
  title: string;
  intro: string;
  sections: Section[];
  registerField: (id: string) => (el: HTMLTextAreaElement | HTMLInputElement | null) => void;
  onIntroChange: (v: string) => void;
  onSectionHeading: (si: number, v: string) => void;
  onClauseChange: (si: number, ci: number, v: string) => void;
  onMoveSection: (si: number, dir: "up" | "down") => void;
  onRemoveSection: (si: number) => void;
  onAddSection: () => void;
  onMoveClause: (si: number, ci: number, dir: "up" | "down") => void;
  onRemoveClause: (si: number, ci: number) => void;
  onAddClause: (si: number) => void;
  supportsSecondSigner: boolean;
}) {
  return (
    <article className="mx-auto max-w-none px-6 py-10 sm:px-12 sm:py-14">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">Nhihad Hassan Photography</p>
      <h1 className="mt-5 text-center text-3xl font-bold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
        {title}
      </h1>
      <textarea
        ref={registerField("intro")}
        value={intro}
        onChange={(e) => onIntroChange(e.target.value)}
        rows={3}
        className={`${fieldClass} mt-6 text-[14px] leading-[1.72] text-ink/78`}
      />

      <div className="mt-12 space-y-9">
        {sections.map((section, si) => (
          <section key={si} className="group/section">
            <div className="flex items-start gap-2">
              <input
                ref={registerField(`section-${si}-heading`)}
                value={section.heading}
                onChange={(e) => onSectionHeading(si, e.target.value)}
                className={`${fieldClass} flex-1 text-[28px] font-bold leading-tight tracking-[-0.015em] text-ink`}
              />
              <div className="mt-2 flex shrink-0 items-center gap-1 opacity-0 transition group-hover/section:opacity-100">
                <button type="button" onClick={() => onMoveSection(si, "up")} disabled={si === 0} className="rounded-md p-2.5 text-ink/40 hover:bg-ink/6 disabled:opacity-20" aria-label="Move section up">
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onMoveSection(si, "down")} disabled={si === sections.length - 1} className="rounded-md p-2.5 text-ink/40 hover:bg-ink/6 disabled:opacity-20" aria-label="Move section down">
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onRemoveSection(si)} className="rounded-md p-2.5 text-[#8a2f24]/70 hover:bg-[#8a2f24]/8" aria-label="Delete section">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {section.clauses.map((clause, ci) => (
                <div key={ci} className="group/clause flex items-start gap-2">
                  <textarea
                    ref={registerField(`section-${si}-clause-${ci}`)}
                    value={clause}
                    onChange={(e) => onClauseChange(si, ci, e.target.value)}
                    rows={Math.max(2, Math.ceil(clause.length / 90))}
                    className={`${fieldClass} flex-1 text-[14px] leading-[1.72] text-ink/78`}
                  />
                  <div className="mt-1 flex shrink-0 items-center gap-1 opacity-0 transition group-hover/clause:opacity-100">
                    <button type="button" onClick={() => onMoveClause(si, ci, "up")} disabled={ci === 0} className="rounded-md p-2.5 text-ink/40 hover:bg-ink/6 disabled:opacity-20" aria-label="Move paragraph up">
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onMoveClause(si, ci, "down")} disabled={ci === section.clauses.length - 1} className="rounded-md p-2.5 text-ink/40 hover:bg-ink/6 disabled:opacity-20" aria-label="Move paragraph down">
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onRemoveClause(si, ci)} className="rounded-md p-2.5 text-[#8a2f24]/70 hover:bg-[#8a2f24]/8" aria-label="Delete paragraph">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onAddClause(si)}
              className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-md border border-ink/12 px-2.5 text-xs font-medium text-ink/60 transition hover:border-ink/30 hover:text-ink"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add paragraph
            </button>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSection}
        className="mt-9 inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/15 px-4 text-sm font-medium text-ink/75 transition hover:border-ink/30 hover:text-ink"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add section
      </button>

      <SignaturePlaceholder supportsSecondSigner={supportsSecondSigner} />
    </article>
  );
}
