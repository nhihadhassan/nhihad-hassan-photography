import { Fragment, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { brandConfig } from "@/lib/config";
import type { AgreementSection } from "@/data/booking-agreement";

export type DetailRow = { label: string; value: string | null };

function Clause({ children }: { children: string }) {
  const match = children.match(/^(\d+\.\d+\s+[^.]+\.)(?:\s+|$)([\s\S]*)$/);

  if (!match) return <>{children}</>;

  return (
    <>
      <span className="font-semibold text-ink/90">{match[1]}</span>
      {match[2] ? ` ${match[2]}` : null}
    </>
  );
}

function AgreementIntro({ children }: { children: string }) {
  const lead = "THIS AGREEMENT";
  if (!children.startsWith(lead)) return <>{children}</>;

  return (
    <>
      <strong className="font-bold text-ink">{lead}</strong>
      {children.slice(lead.length)}
    </>
  );
}

function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y divide-ink/12 border-y border-ink/12">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]">
          <dt className="text-[13px] font-semibold text-ink/60 print:text-[8pt]">{row.label}</dt>
          <dd className="text-[13px] text-ink/85 print:text-[8pt]">
            {row.value ? row.value : <span className="mt-3 block h-5 max-w-xs border-b border-dashed border-ink/30" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The rendered booking-agreement contract: header, intro, the per-client
 * details table, and the clause sections. Shared by the public
 * /booking-agreement page and the tokenized /agreement/[token] signing page.
 * `actionSlot` renders under the intro (e.g. a print button); `signatureSlot`
 * renders at the end (blank lines, a sign form, or a completed signature).
 */
export function AgreementDocument({
  title = "Photography Services Agreement",
  intro,
  sections,
  detailRows,
  feeRows,
  actionSlot,
  signatureSlot,
}: {
  title?: string;
  intro: string;
  sections: AgreementSection[];
  detailRows: DetailRow[];
  feeRows?: DetailRow[];
  actionSlot?: ReactNode;
  signatureSlot?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-none px-6 py-10 sm:px-12 sm:py-14 print:px-[0.72in] print:py-[0.62in]">
      <Reveal>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50 print:text-[7.5pt]">
          {brandConfig.name}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-none sm:text-5xl print:text-[16pt] print:leading-[1.24]">
          {title}
        </h1>
        <p className="mt-6 text-[14px] leading-[1.72] text-ink/78 print:text-[8.5pt] print:leading-[1.55]">
          <AgreementIntro>{intro}</AgreementIntro>
        </p>

        {actionSlot ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">{actionSlot}</div>
        ) : null}
      </Reveal>

      <Reveal delay={0.05}>
        <section className="mt-12">
          <h2 className="font-serif text-3xl font-medium leading-none text-ink print:text-[12.5pt] print:leading-[1.3]">
            Agreement details
          </h2>
          <dl className="mt-4 divide-y divide-ink/12 border-y border-ink/12">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]">
              <dt className="text-[13px] font-semibold text-ink/60 print:text-[8pt]">Photographer</dt>
              <dd className="text-[13px] text-ink/85 print:text-[8pt]">
                {brandConfig.name}, {brandConfig.contactEmail}, Toronto, Ontario
              </dd>
            </div>
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]"
              >
                <dt className="text-[13px] font-semibold text-ink/60 print:text-[8pt]">{row.label}</dt>
                <dd className="text-[13px] text-ink/85 print:text-[8pt]">
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
        <div className="mt-12 space-y-9 print:space-y-6">
          {sections.map((section) => (
            <section key={section.heading} className="break-inside-avoid">
              <h2 className="font-serif text-3xl font-medium leading-none text-ink print:text-[12.5pt] print:leading-[1.3]">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.clauses.map((clause, i) => (
                  <Fragment key={i}>
                    <p className="text-[14px] leading-[1.72] text-ink/78 print:text-[8.5pt] print:leading-[1.55]">
                      <Clause>{clause}</Clause>
                    </p>
                    {section.heading.startsWith("2.") && i === 0 && feeRows?.length ? (
                      <div className="py-1"><DetailTable rows={feeRows} /></div>
                    ) : null}
                  </Fragment>
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
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink print:text-[12.5pt]">
        Signatures
      </h2>
      <p className="mt-3 text-[14px] leading-6 text-ink/75 print:text-[8.5pt]">
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
    let value = raw;
    if (value && moneyParams.has(field.param) && !value.startsWith("$")) value = `$${value}`;
    if (value && field.param === "hourly" && !/\/\s*hour$/i.test(value)) value = `${value}/hour`;
    if (value && field.param === "lateFeePercent" && !value.endsWith("%")) value = `${value}%`;
    if (value && field.param === "balanceDueDate" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      value = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
    }
    return { label: field.label, value: value || null };
  });
}
