"use client";

import { Fragment, type ReactNode } from "react";
import { brandConfig } from "@/lib/config";
import type { AgreementSection } from "@/data/booking-agreement";
import type { PricingCategory } from "@/data/pricing";
import { AGREEMENT_INTRO_LEAD, parseRichText, splitClauseLead } from "@/lib/rich-text-tokens";

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
};

type FieldRow = { param: string; label: string };

/** Per-param control override; anything absent falls back to a plain text input. */
const FIELD_CONTROLS: Record<string, "date" | "money" | "textarea" | "package" | "window" | "license" | "yesno"> = {
  effectiveDate: "date",
  total: "money",
  hourly: "money",
  deposit: "money",
  balance: "money",
  type: "package",
  window: "window",
  licenseType: "license",
  secondShooter: "yesno",
  cancellationPolicy: "textarea",
  reschedulePolicy: "textarea",
  revisionPolicy: "textarea",
  specialRequests: "textarea",
  description: "textarea",
};

const licenseOptions = ["Personal use only", "Commercial use for the Client’s own marketing"];
const windowOptions = [
  "1 year from delivery",
  "30 days from delivery",
  "60 days from delivery",
  "90 days from delivery",
  "No expiry",
];

function exactPrice(price: string): string {
  if (/[–-]/.test(price)) return "";
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
}

const fieldBase =
  "inline-block max-w-full rounded-sm border-b border-dashed border-ink/35 bg-ink/[0.03] px-1 align-baseline text-inherit outline-none transition placeholder:text-ink/35 hover:border-ink/55 hover:bg-ink/[0.05] focus:border-admin-copper focus:bg-admin-copper/8";

function EditableField({
  param,
  value,
  onChange,
  pricing,
}: {
  param: string;
  value: string | undefined;
  onChange: (param: string, value: string) => void;
  pricing?: PricingCategory[];
}) {
  const label = VARIABLE_LABELS[param] ?? param;
  const control = FIELD_CONTROLS[param];
  const current = value ?? "";
  const width = `${Math.max((current || label).length + 1, 4)}ch`;

  if (control === "date") {
    return (
      <input
        type="date"
        aria-label={label}
        value={current}
        onChange={(e) => onChange(param, e.target.value)}
        className={`${fieldBase} min-w-[9.5rem]`}
      />
    );
  }

  if (control === "money") {
    return (
      <span className="inline-flex items-baseline gap-0.5 align-baseline">
        <span className="text-ink/55">$</span>
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={current}
          placeholder="0"
          onChange={(e) => onChange(param, e.target.value)}
          style={{ width: `${Math.max(current.length + 1, 3)}ch` }}
          className={fieldBase}
        />
      </span>
    );
  }

  if (control === "textarea") {
    return (
      <textarea
        aria-label={label}
        value={current}
        placeholder={`Enter ${label}`}
        onChange={(e) => onChange(param, e.target.value)}
        rows={Math.max(1, Math.ceil(current.length / 70))}
        className={`${fieldBase} w-full min-w-[16rem] resize-y align-top`}
      />
    );
  }

  if (control === "package") {
    return (
      <select
        aria-label={label}
        value={current}
        onChange={(e) => onChange(param, e.target.value)}
        className={`${fieldBase} max-w-full`}
      >
        <option value="">Choose a package</option>
        {(pricing ?? []).map((category) => (
          <optgroup key={category.id} label={category.label}>
            {category.tiers.map((tier) => (
              <option key={`${category.id}-${tier.name}`} value={`${category.label} · ${tier.name}`}>
                {tier.name} · {tier.price}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="Custom photography coverage">Custom photography coverage</option>
      </select>
    );
  }

  if (control === "window") {
    return (
      <select aria-label={label} value={current} onChange={(e) => onChange(param, e.target.value)} className={fieldBase}>
        {windowOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (control === "license") {
    return (
      <select aria-label={label} value={current} onChange={(e) => onChange(param, e.target.value)} className={fieldBase}>
        {licenseOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (control === "yesno") {
    return (
      <select aria-label={label} value={current || "No"} onChange={(e) => onChange(param, e.target.value)} className={fieldBase}>
        <option>No</option>
        <option>Yes</option>
      </select>
    );
  }

  return (
    <input
      type="text"
      aria-label={label}
      value={current}
      placeholder={`Enter ${label}`}
      onChange={(e) => onChange(param, e.target.value)}
      style={{ width }}
      className={fieldBase}
    />
  );
}

function EditableRichText({ text, values, onChange, pricing }: {
  text: string;
  values: Record<string, string | undefined>;
  onChange: (param: string, value: string) => void;
  pricing?: PricingCategory[];
}) {
  return (
    <>
      {parseRichText(text).map((token, index) => {
        if (token.type === "variable") {
          return (
            <EditableField
              key={`${token.key}-${index}`}
              param={token.key}
              value={values[token.key]}
              onChange={onChange}
              pricing={pricing}
            />
          );
        }
        if (token.type === "quoted") {
          return <strong key={`${token.value}-${index}`} className="font-bold text-ink">{token.value}</strong>;
        }
        return <Fragment key={index}>{token.value}</Fragment>;
      })}
    </>
  );
}

function EditableClause({ clause, values, onChange, pricing }: {
  clause: string;
  values: Record<string, string | undefined>;
  onChange: (param: string, value: string) => void;
  pricing?: PricingCategory[];
}) {
  const { lead, rest } = splitClauseLead(clause);
  if (!lead) return <EditableRichText text={clause} values={values} onChange={onChange} pricing={pricing} />;
  return (
    <>
      <span className="font-semibold text-ink/90">{lead}</span>
      {rest ? <> <EditableRichText text={rest} values={values} onChange={onChange} pricing={pricing} /></> : null}
    </>
  );
}

function EditableFieldList({ rows, values, onChange, pricing }: {
  rows: FieldRow[];
  values: Record<string, string | undefined>;
  onChange: (param: string, value: string) => void;
  pricing?: PricingCategory[];
}) {
  return (
    <div className="space-y-1.5 border-l-2 border-ink/10 pl-4 text-[14px] text-ink/78 print:hidden">
      {rows.map((row) => (
        <div key={row.param} className="leading-7">
          <span>{row.label}: </span>
          <EditableField param={row.param} value={values[row.param]} onChange={onChange} pricing={pricing} />
        </div>
      ))}
    </div>
  );
}

function EditableFeeList({ values, onChange, depositTerm }: {
  values: Record<string, string | undefined>;
  onChange: (param: string, value: string) => void;
  depositTerm: "Retainer" | "Deposit";
}) {
  const lineClass = "text-[14px] leading-7 text-ink/78";
  return (
    <ul className="list-disc space-y-1.5 pl-7 print:hidden">
      <li className={lineClass}>
        Total Fee for Services: <EditableField param="total" value={values.total} onChange={onChange} />
      </li>
      <li className={lineClass}>
        Additional Hourly Pricing: <EditableField param="hourly" value={values.hourly} onChange={onChange} />
      </li>
      <li className={lineClass}>
        {depositTerm} due upon signing: <EditableField param="deposit" value={values.deposit} onChange={onChange} />
      </li>
      <li className={lineClass}>
        Remaining amount due on <EditableField param="balanceDueDate" value={values.balanceDueDate} onChange={onChange} />:{" "}
        <EditableField param="balance" value={values.balance} onChange={onChange} />
      </li>
    </ul>
  );
}

const serviceFieldRows: FieldRow[] = [
  { param: "type", label: "Type of shoot" },
  { param: "date", label: "Date of services" },
  { param: "startTime", label: "Start time" },
  { param: "coverageTime", label: "Coverage time" },
  { param: "location", label: "Venue and full address" },
  { param: "secondLocation", label: "Second location" },
  { param: "onsiteContactName", label: "On-site contact" },
  { param: "onsiteContactPhone", label: "On-site contact phone" },
  { param: "secondShooter", label: "Second shooter" },
  { param: "minimumEditedImages", label: "Minimum edited images" },
  { param: "turnaroundBusinessDays", label: "Turnaround in business days" },
  { param: "specialRequests", label: "Restrictions / special requests" },
];

/**
 * Document-first agreement builder surface: mirrors AgreementDocument's
 * reference-formatting layout so switching to the real Preview page doesn't
 * jump, but every `{{token}}` renders as an inline fillable control instead
 * of static/pill text. Kept as a separate surface from AgreementDocument for
 * the same reason the template editor's EditableDocument is separate — that
 * component also renders every signed agreement and every PDF, and threading
 * edit-mode through it would risk both.
 */
export function AgreementEditableDocument({
  title,
  intro,
  sections,
  values,
  onChange,
  pricing,
  depositTerm,
  signatureSlot,
}: {
  title: string;
  intro: string;
  sections: AgreementSection[];
  values: Record<string, string | undefined>;
  onChange: (param: string, value: string) => void;
  pricing?: PricingCategory[];
  depositTerm: "Retainer" | "Deposit";
  signatureSlot?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-none px-6 py-10 text-ink sm:px-12 sm:py-14">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">{brandConfig.name}</p>
      <h1 className="mt-5 text-center text-3xl font-bold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-6 text-[14px] leading-[1.9] text-ink/78">
        <strong className="font-bold text-ink">{AGREEMENT_INTRO_LEAD}</strong>
        <EditableRichText text={intro.slice(AGREEMENT_INTRO_LEAD.length)} values={values} onChange={onChange} />
      </p>

      <div className="mt-12 space-y-9">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.015em] text-ink">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.clauses.map((clause, i) => (
                <Fragment key={i}>
                  <p className="text-[14px] leading-[1.9] text-ink/78">
                    <EditableClause clause={clause} values={values} onChange={onChange} pricing={pricing} />
                  </p>
                  {section.heading.startsWith("1.") && i === 0 ? (
                    <EditableFieldList rows={serviceFieldRows} values={values} onChange={onChange} pricing={pricing} />
                  ) : null}
                  {section.heading.startsWith("2.") && i === 0 ? (
                    <EditableFeeList values={values} onChange={onChange} depositTerm={depositTerm} />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </section>
        ))}
      </div>

      {signatureSlot}
    </article>
  );
}

export { exactPrice };
