import { AlertCircle } from "lucide-react";
import type { ClientEditableField } from "@/lib/agreements";

/**
 * "Before you sign" banner listing every inline blank still empty on the
 * contract, each linking straight to that field (native anchor scroll --
 * scroll-smooth is set on <html>). Without this, an empty field is just a
 * quietly-styled box the client has to spot on their own while reading a
 * multi-page contract; this makes what's outstanding impossible to miss.
 */
export function AgreementMissingFieldsNotice({
  fields,
}: {
  fields: { param: ClientEditableField; label: string }[];
}) {
  if (!fields.length) return null;

  return (
    <div className="mt-6 flex items-start gap-3 border border-[#c0392b]/30 bg-[#c0392b]/[0.05] px-4 py-3.5 print:hidden">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#c0392b]" aria-hidden="true" />
      <p className="text-sm leading-6 text-ink/80">
        <span className="font-semibold text-ink">Before you sign,</span> please fill in{" "}
        {fields.map((field, index) => (
          <span key={field.param}>
            {index > 0 ? (index === fields.length - 1 ? " and " : ", ") : ""}
            <a
              href={`#agreement-field-${field.param}`}
              className="font-medium text-[#c0392b] underline decoration-[#c0392b]/40 underline-offset-2 hover:decoration-[#c0392b]"
            >
              your {field.label}
            </a>
          </span>
        ))}
        {" "}on the contract below.
      </p>
    </div>
  );
}
