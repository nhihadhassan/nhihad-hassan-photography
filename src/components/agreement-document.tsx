import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { brandConfig } from "@/lib/config";
import type { AgreementSection } from "@/data/booking-agreement";

export type DetailRow = { label: string; value: string | null };

/**
 * The rendered booking-agreement contract: header, intro, disclaimer, the
 * per-client details table, and the clause sections. Shared by the public
 * /booking-agreement page and the tokenized /agreement/[token] signing page.
 * `actionSlot` renders under the intro (e.g. a print button); `signatureSlot`
 * renders at the end (blank lines, a sign form, or a completed signature).
 */
export function AgreementDocument({
  intro,
  disclaimer,
  sections,
  detailRows,
  actionSlot,
  signatureSlot,
}: {
  intro: string;
  disclaimer: string;
  sections: AgreementSection[];
  detailRows: DetailRow[];
  actionSlot?: ReactNode;
  signatureSlot?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{brandConfig.name}</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] sm:text-6xl">Booking Agreement</h1>
        <p className="mt-6 text-base leading-7 text-ink/70">{intro}</p>

        {actionSlot ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">{actionSlot}</div>
        ) : null}

        <p className="mt-6 rounded-md border border-ink/15 bg-white/50 px-4 py-3 text-sm leading-6 text-ink/65">
          {disclaimer}
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink">Agreement details</h2>
          <dl className="mt-4 divide-y divide-ink/12 border-y border-ink/12">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]">
              <dt className="text-sm font-medium text-ink/60">Photographer</dt>
              <dd className="text-sm text-ink/85">
                {brandConfig.name}, {brandConfig.contactEmail}, Toronto, Ontario
              </dd>
            </div>
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]"
              >
                <dt className="text-sm font-medium text-ink/60">{row.label}</dt>
                <dd className="text-sm text-ink/85">
                  {row.value ? (
                    row.value
                  ) : (
                    <span className="mt-3 block h-5 max-w-xs border-b border-dashed border-ink/30" />
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mt-12 space-y-9">
          {sections.map((section) => (
            <section key={section.heading} className="break-inside-avoid">
              <h2 className="font-serif text-2xl text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.clauses.map((clause, i) => (
                  <p key={i} className="text-sm leading-7 text-ink/75">
                    {clause}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Reveal>

      {signatureSlot ? <Reveal delay={0.05}>{signatureSlot}</Reveal> : null}
    </article>
  );
}

/** The blank, print-to-sign signature block used on the public contract page. */
export function BlankSignatureBlock() {
  return (
    <section className="mt-14 break-inside-avoid">
      <h2 className="font-serif text-2xl text-ink">Signatures</h2>
      <p className="mt-3 text-sm leading-7 text-ink/75">
        By signing below, both parties agree to the terms set out in this agreement.
      </p>
      <div className="mt-8 grid gap-10 sm:grid-cols-2">
        {["Client", "Photographer"].map((role) => (
          <div key={role}>
            <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{role}</p>
            <div className="mt-8 border-t border-ink/40" />
            <p className="mt-1 text-xs text-ink/55">Name</p>
            <div className="mt-8 border-t border-ink/40" />
            <p className="mt-1 text-xs text-ink/55">Signature</p>
            <div className="mt-8 border-t border-ink/40" />
            <p className="mt-1 text-xs text-ink/55">Date</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Build the per-client detail rows from a flat record of field values. */
export function buildDetailRows(
  fields: { param: string; label: string }[],
  values: Record<string, string | undefined>,
  moneyParams: Set<string>,
): DetailRow[] {
  return fields.map((field) => {
    const raw = (values[field.param] ?? "").trim();
    const value = raw && moneyParams.has(field.param) && !raw.startsWith("$") ? `$${raw}` : raw;
    return { label: field.label, value: value || null };
  });
}
