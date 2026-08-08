"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Mail, Save, Settings2 } from "lucide-react";
import type { AgreementSection } from "@/data/booking-agreement";
import type { AgreementDetails } from "@/lib/agreements";
import type { PricingCategory } from "@/data/pricing";
import { buildAgreementValues } from "@/lib/agreement-values";
import { AgreementEditableDocument, exactPrice } from "@/components/agreement-editable-document";
import { saveAgreementDraftAction } from "@/app/admin/(protected)/agreements/actions";

type SaveState = "idle" | "saving" | "saved" | "error";
const AUTOSAVE_DELAY_MS = 1200;

const fieldClass =
  "min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/50 focus:border-admin-copper";

function isWeddingTemplate(template: string | undefined) {
  return template === "wedding";
}

export function AgreementBuilder({
  requestId,
  clientName: initialClientName,
  clientEmail: initialClientEmail,
  details: initialDetails,
  message: initialMessage,
  title,
  intro,
  sections,
  depositTerm,
  pricing,
}: {
  requestId: string;
  clientName: string;
  clientEmail: string;
  details: AgreementDetails;
  message: string;
  title: string;
  intro: string;
  sections: AgreementSection[];
  depositTerm: "Retainer" | "Deposit";
  pricing: PricingCategory[];
}) {
  const [saving, startTransition] = useTransition();
  const [clientName, setClientName] = useState(initialClientName);
  const [clientEmail, setClientEmail] = useState(initialClientEmail);
  const [details, setDetails] = useState<AgreementDetails>(initialDetails);
  const [message, setMessage] = useState(initialMessage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ clientName, clientEmail, details, message });
  useEffect(() => {
    latestRef.current = { clientName, clientEmail, details, message };
  }, [clientName, clientEmail, details, message]);

  const save = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    startTransition(async () => {
      const { clientName: name, clientEmail: email, details: currentDetails, message: currentMessage } = latestRef.current;
      const result = await saveAgreementDraftAction(requestId, {
        clientName: name,
        clientEmail: email || null,
        message: currentMessage,
        details: currentDetails,
      });
      setSaveState(result.ok ? "saved" : "error");
      dirtyRef.current = false;
    });
  }, [requestId]);

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

  useEffect(() => {
    const handler = () => {
      if (dirtyRef.current) save();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [save]);

  const setDetail = (patch: Partial<AgreementDetails>) => {
    setDetails((prev) => ({ ...prev, ...patch }));
    scheduleSave();
  };

  const handleVariableChange = (param: string, value: string) => {
    if (param === "clientName") {
      setClientName(value);
      scheduleSave();
      return;
    }
    if (param === "clientEmail") {
      setClientEmail(value);
      scheduleSave();
      return;
    }
    if (param === "type") {
      const match = pricing
        .flatMap((category) => category.tiers.map((tier) => ({ value: `${category.label} · ${tier.name}`, tier })))
        .find((candidate) => candidate.value === value);
      setDetails((prev) => ({
        ...prev,
        type: value,
        description: value,
        total: match ? exactPrice(match.tier.price) : prev.total,
      }));
      scheduleSave();
      return;
    }
    setDetail({ [param]: value } as Partial<AgreementDetails>);
  };

  const values = useMemo(
    () => buildAgreementValues(clientName, clientEmail, details),
    [clientName, clientEmail, details],
  );

  const supportsSecondSigner = isWeddingTemplate(details.template);
  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save" : saveState === "saved" ? "Saved" : "";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="sticky top-[57px] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-ink/10 bg-admin-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/agreements"
            className="inline-flex items-center gap-1.5 text-sm text-admin-ink/60 transition hover:text-admin-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Contracts
          </Link>
          <span className="text-admin-ink/20">/</span>
          <div className="min-w-0">
            <p className="truncate font-medium text-admin-ink">{clientName || "Untitled agreement"}</p>
            <p className="text-xs text-admin-ink/45">Draft{saveLabel ? ` · ${saveLabel}` : ""}</p>
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
            Details
          </button>
          <a
            href={`/admin/agreements/${requestId}/preview`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Preview
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6 disabled:opacity-50"
          >
            <Save className="size-3.5" aria-hidden="true" />
            Save draft
          </button>
          <Link
            href={`/admin/agreements/${requestId}/preview#send`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-admin-ink px-3 text-xs font-medium text-admin-surface"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            Send agreement
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <p className="mb-4 text-xs text-admin-ink/50">
            Fill in the blanks directly on the contract. Changes save automatically.
          </p>
          <div className="overflow-hidden rounded-md border border-admin-ink/10 bg-[#fbfaf7] shadow-[0_8px_28px_rgba(23,19,15,0.08)]">
            <AgreementEditableDocument
              title={title}
              intro={intro}
              sections={sections}
              values={values}
              onChange={handleVariableChange}
              pricing={pricing}
              depositTerm={depositTerm}
              signatureSlot={<SignaturePlaceholder supportsSecondSigner={supportsSecondSigner} />}
            />
          </div>
        </div>

        {sidebarOpen ? (
          <aside className="h-fit rounded-md border border-admin-ink/10 bg-admin-surface p-4 lg:sticky lg:top-[140px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-admin-ink/50">Agreement details</p>
            <div className="mt-3 space-y-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Client name</span>
                <input
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    scheduleSave();
                  }}
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Client email</span>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => {
                    setClientEmail(e.target.value);
                    scheduleSave();
                  }}
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Client phone</span>
                <input
                  value={details.phone ?? ""}
                  onChange={(e) => setDetail({ phone: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Client mailing address</span>
                <textarea
                  value={details.clientAddress ?? ""}
                  onChange={(e) => setDetail({ clientAddress: e.target.value })}
                  rows={2}
                  className={`${fieldClass} resize-y py-2`}
                />
              </label>
              {supportsSecondSigner ? (
                <>
                  <div className="border-t border-admin-ink/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-admin-ink/50">Second signer</p>
                  </div>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-admin-ink/80">Name</span>
                    <input
                      value={details.secondSignerName ?? ""}
                      onChange={(e) => setDetail({ secondSignerName: e.target.value })}
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-admin-ink/80">Email</span>
                    <input
                      type="email"
                      value={details.secondSignerEmail ?? ""}
                      onChange={(e) => setDetail({ secondSignerEmail: e.target.value })}
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-admin-ink/80">Phone</span>
                    <input
                      value={details.secondSignerPhone ?? ""}
                      onChange={(e) => setDetail({ secondSignerPhone: e.target.value })}
                      className={fieldClass}
                    />
                  </label>
                </>
              ) : null}
              <div className="border-t border-admin-ink/10 pt-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-admin-ink/80">
                    Internal note <span className="font-normal text-admin-ink/50">(not shown to client)</span>
                  </span>
                  <textarea
                    value={message}
                    rows={2}
                    placeholder="Private reminder or context"
                    className={`${fieldClass} resize-y py-2`}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      scheduleSave();
                    }}
                  />
                </label>
              </div>
              <p className="text-xs leading-5 text-admin-ink/45">
                Signing deadlines and reminder emails are set from the contract list once this draft is
                ready to send.
              </p>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Static placeholder shown only inside the builder. The real agreement page
 * uses the actual signing UI and the built-in photographer signature.png
 * block — this never appears there.
 */
function SignaturePlaceholder({ supportsSecondSigner }: { supportsSecondSigner: boolean }) {
  return (
    <section className="mt-14 print:hidden">
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
