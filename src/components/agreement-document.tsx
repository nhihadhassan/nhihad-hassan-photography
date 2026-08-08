import { Fragment, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { brandConfig } from "@/lib/config";
import type { AgreementSection } from "@/data/booking-agreement";

export type DetailRow = { param: string; label: string; value: string | null };

const VARIABLE_LABELS: Record<string, string> = {
  effectiveDate: "effective date",
  clientName: "client name",
  partnerName: "partner name",
  clientAddress: "client address",
  signerName: "authorized signer name",
  signerTitle: "authorized signer title",
  secondSignerName: "second signer name",
  secondSignerEmail: "second signer email",
  secondSignerPhone: "second signer phone",
  clientPhone: "client phone",
  city: "city name",
  cancellationNoticeDays: "number of days",
  mealHours: "number of hours",
  galleryWindow: "gallery availability window",
  turnaroundBusinessDays: "turnaround in business days",
  rehostingFee: "gallery rehosting fee",
  revisionPolicy: "revision allowance",
  archiveWindow: "image archive period",
  cancellationPolicy: "cancellation tiers",
  reschedulePolicy: "rescheduling policy",
  additionalCharges: "separately billed items",
  licenseType: "client licence type",
  privacyOptOutFee: "privacy opt-out surcharge",
  clientEmail: "client email",
  photographerName: "photographer name",
  photographerBusinessName: "photographer business name",
};

function formatVariableValue(param: string, value?: string): string | undefined {
  if (value && param === "lateFeePercent" && !value.endsWith("%")) return `${value}%`;
  if (value && param === "rehostingFee" && /^\d[\d,.]*(?:\.\d+)?$/.test(value)) return `$${value}`;
  if (!value || !["effectiveDate", "balanceDueDate"].includes(param) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function VariableValue({ value, label, underlined = false }: { value?: string; label: string; underlined?: boolean }) {
  if (value) {
    return underlined ? (
      <span className="font-medium underline decoration-ink/55 decoration-1 underline-offset-2">{value}</span>
    ) : (
      <mark className="rounded-[2px] bg-[#fff4a8] px-1 font-semibold text-ink print:bg-[#fff4a8]">{value}</mark>
    );
  }

  return (
    <mark className="rounded-[2px] bg-[#fff4a8] px-1 font-semibold text-ink print:bg-[#fff4a8]">
      [Enter {label}]
    </mark>
  );
}

function RichText({ text, values, underlineVariables = false }: {
  text: string;
  values: Record<string, string | undefined>;
  underlineVariables?: boolean;
}) {
  const tokenPattern = /(\{\{[A-Za-z]+\}\}|“[^”]+”)/g;
  return (
    <>
      {text.split(tokenPattern).filter(Boolean).map((part, index) => {
        const variable = part.match(/^\{\{([A-Za-z]+)\}\}$/)?.[1];
        if (variable) {
          return (
            <VariableValue
              key={`${variable}-${index}`}
              value={formatVariableValue(variable, values[variable])}
              label={VARIABLE_LABELS[variable] ?? variable}
              underlined={underlineVariables}
            />
          );
        }
        if (/^“[^”]+”$/.test(part)) {
          return <strong key={`${part}-${index}`} className="font-bold text-ink">{part}</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

function Clause({ children, values, referenceFormatting }: {
  children: string;
  values: Record<string, string | undefined>;
  referenceFormatting: boolean;
}) {
  const match = children.match(/^(\d+\.\d+\s+[^.]+\.)(?:\s+|$)([\s\S]*)$/);

  if (!match) return referenceFormatting ? <RichText text={children} values={values} /> : <>{children}</>;

  return (
    <>
      <span className="font-semibold text-ink/90">{match[1]}</span>
      {match[2] ? <> {referenceFormatting ? <RichText text={match[2]} values={values} /> : match[2]}</> : null}
    </>
  );
}

function AgreementIntro({ children, values, referenceFormatting }: {
  children: string;
  values: Record<string, string | undefined>;
  referenceFormatting: boolean;
}) {
  const lead = "THIS AGREEMENT";
  if (!referenceFormatting || !children.startsWith(lead)) return <>{children}</>;

  return (
    <>
      <strong className="font-bold text-ink">{lead}</strong>
      <RichText text={children.slice(lead.length)} values={values} underlineVariables />
    </>
  );
}

function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y divide-ink/12 border-y border-ink/12">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] break-inside-avoid">
          <dt className="text-[13px] font-semibold text-ink/60 print:text-[10pt]">{row.label}</dt>
          <dd className="text-[13px] text-ink/85 print:text-[10pt]">
            {row.value ? row.value : <span className="mt-3 block h-5 max-w-xs border-b border-dashed border-ink/30" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function VariableList({ rows, bullets = false }: { rows: DetailRow[]; bullets?: boolean }) {
  const items = rows.map((row) => (
    <div key={row.param} className="leading-7">
      <span>{row.label}: </span>
      <VariableValue value={row.value ?? undefined} label={row.label.toLowerCase()} />
    </div>
  ));

  return bullets ? (
    <ul className="list-disc space-y-0.5 pl-7 text-[14px] text-ink/78 break-inside-avoid print:text-[10.5pt]">
      {items.map((item, index) => <li key={rows[index].param}>{item}</li>)}
    </ul>
  ) : (
    <div className="space-y-0.5 border-l-2 border-ink/10 pl-4 text-[14px] text-ink/78 break-inside-avoid print:text-[10.5pt]">
      {items}
    </div>
  );
}

function FeeList({ rows, depositTerm }: { rows: DetailRow[]; depositTerm: "Retainer" | "Deposit" }) {
  const value = (param: string) => rows.find((row) => row.param === param)?.value ?? undefined;
  const lineClass = "text-[14px] leading-7 text-ink/78 print:text-[10.5pt]";

  return (
    <ul className="list-disc space-y-0.5 pl-7 break-inside-avoid">
      <li className={lineClass}>
        Total Fee for Services: <VariableValue value={value("total")} label="total fee for services" />
      </li>
      <li className={lineClass}>
        Additional Hourly Pricing: <VariableValue value={value("hourly")} label="additional hourly pricing" />
      </li>
      <li className={lineClass}>
        {depositTerm} due upon signing: <VariableValue value={value("deposit")} label={`${depositTerm.toLowerCase()} due upon signing`} />
      </li>
      <li className={lineClass}>
        Remaining amount due on <VariableValue value={value("balanceDueDate")} label="final due date" />:{" "}
        <VariableValue value={value("balance")} label="remaining amount" />
      </li>
    </ul>
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
  serviceRows,
  feeRows,
  agreementValues = {},
  referenceFormatting = false,
  depositTerm = "Retainer",
  actionSlot,
  signatureSlot,
}: {
  title?: string;
  intro: string;
  sections: AgreementSection[];
  detailRows: DetailRow[];
  serviceRows?: DetailRow[];
  feeRows?: DetailRow[];
  agreementValues?: Record<string, string | undefined>;
  referenceFormatting?: boolean;
  depositTerm?: "Retainer" | "Deposit";
  actionSlot?: ReactNode;
  signatureSlot?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-none px-6 py-10 sm:px-12 sm:py-14 print:px-0 print:py-0">
      <Reveal>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50 print:text-[8pt]">
          {brandConfig.name}
        </p>
        <h1 className={referenceFormatting
          ? "mt-5 text-center text-3xl font-bold leading-tight tracking-[-0.02em] text-ink sm:text-4xl print:text-[20pt]"
          : "mt-3 font-serif text-4xl font-medium leading-none sm:text-5xl print:text-[19pt] print:leading-[1.3]"
        }>
          {title}
        </h1>
        <p className="mt-6 text-[14px] leading-[1.72] text-ink/78 print:text-[10.5pt] print:leading-[1.5]">
          <AgreementIntro values={agreementValues} referenceFormatting={referenceFormatting}>{intro}</AgreementIntro>
        </p>

        {actionSlot ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">{actionSlot}</div>
        ) : null}
      </Reveal>

      {!referenceFormatting ? <Reveal delay={0.05}>
        <section className="mt-12 break-inside-avoid">
          <h2 className="font-serif text-3xl font-medium leading-none text-ink break-after-avoid print:text-[14pt] print:leading-[1.3]">
            Agreement details
          </h2>
          <dl className="mt-4 divide-y divide-ink/12 border-y border-ink/12">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] break-inside-avoid">
              <dt className="text-[13px] font-semibold text-ink/60 print:text-[10pt]">Photographer</dt>
              <dd className="text-[13px] text-ink/85 print:text-[10pt]">
                {brandConfig.name}, {brandConfig.contactEmail}, Toronto, Ontario
              </dd>
            </div>
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] break-inside-avoid"
              >
                <dt className="text-[13px] font-semibold text-ink/60 print:text-[10pt]">{row.label}</dt>
                <dd className="text-[13px] text-ink/85 print:text-[10pt]">
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
      </Reveal> : null}

      <Reveal delay={0.05}>
        <div className="mt-12 space-y-9 print:space-y-6">
          {sections.map((section) => (
            <section key={section.heading} className="break-inside-avoid">
              <h2 className={(referenceFormatting
                ? "text-[28px] font-bold leading-tight tracking-[-0.015em] text-ink print:text-[16pt]"
                : "font-serif text-3xl font-medium leading-none text-ink print:text-[14pt] print:leading-[1.3]"
              ) + " break-after-avoid"}>
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.clauses.map((clause, i) => (
                  <Fragment key={i}>
                    <p className="text-[14px] leading-[1.72] text-ink/78 print:text-[10.5pt] print:leading-[1.5]">
                      <Clause values={agreementValues} referenceFormatting={referenceFormatting}>{clause}</Clause>
                    </p>
                    {referenceFormatting && section.heading.startsWith("1.") && i === 0 && serviceRows?.length ? (
                      <div className="py-2"><VariableList rows={serviceRows} /></div>
                    ) : null}
                    {section.heading.startsWith("2.") && i === 0 && feeRows?.length ? (
                      <div className="py-2">
                        {referenceFormatting ? <FeeList rows={feeRows} depositTerm={depositTerm} /> : <DetailTable rows={feeRows} />}
                      </div>
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
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink break-after-avoid print:text-[14pt]">
        Signatures
      </h2>
      <p className="mt-3 text-[14px] leading-6 text-ink/75 print:text-[10.5pt]">
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
    if (value && moneyParams.has(field.param) && /^\d[\d,.]*(?:\.\d+)?$/.test(value)) value = `$${value}`;
    if (value && field.param === "hourly" && !/\/\s*hour$/i.test(value)) value = `${value}/hour`;
    if (value && field.param === "lateFeePercent" && !value.endsWith("%")) value = `${value}%`;
    value = formatVariableValue(field.param, value) ?? "";
    return { param: field.param, label: field.label, value: value || null };
  });
}
