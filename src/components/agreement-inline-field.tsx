"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { submitMissingDetailsAction } from "@/app/agreement/[token]/actions";
import type { ClientEditableField } from "@/lib/agreements";

const SAVE_DELAY_MS = 900;

/**
 * A contract blank the client fills in directly on the document, the same
 * way a paper contract works, instead of a separate "please reply with"
 * form bolted on top. Autosaves to the agreement (token-scoped, limited to
 * ClientEditableField) so what's on the page is always what's saved. Empty
 * fields carry a pulsing dot so they read as outstanding, not just styled
 * text -- paired with the summary banner (see AgreementMissingFieldsNotice)
 * that lists and links to every field still blank.
 */
export function AgreementInlineField({
  token,
  param,
  value,
  label,
  underlined = false,
}: {
  token: string;
  param: ClientEditableField;
  value?: string;
  label: string;
  underlined?: boolean;
}) {
  const [current, setCurrent] = useState(value ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedValueRef = useRef(value ?? "");

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const save = (val: string) => {
    if (val === savedValueRef.current) return;
    setStatus("saving");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("token", token);
      formData.set(param, val);
      const result = await submitMissingDetailsAction({ status: "idle", message: "" }, formData);
      if (result.status === "success") {
        savedValueRef.current = val;
        setStatus("saved");
      } else {
        setStatus("error");
      }
    });
  };

  const handleChange = (val: string) => {
    setCurrent(val);
    setStatus("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), SAVE_DELAY_MS);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save(current);
  };

  const placeholder = `Your ${label}`;
  const width = `${Math.max((current || placeholder).length + 2, 10)}ch`;
  const empty = !current.trim();

  return (
    <span className="inline-flex items-baseline gap-1.5 align-baseline">
      {empty ? (
        <span className="relative inline-flex size-2 shrink-0 self-center" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#c0392b]/60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#c0392b]" />
        </span>
      ) : null}
      <input
        id={`agreement-field-${param}`}
        type={param === "phone" ? "tel" : "text"}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={`Your ${label}`}
        aria-required="true"
        style={{ width }}
        className={
          "max-w-full rounded-sm border-0 border-b-2 px-1 outline-none transition placeholder:font-normal placeholder:text-ink/40 focus:border-[#8b6444] focus:bg-[#8b6444]/[0.14] " +
          (empty
            ? "border-[#c0392b]/60 bg-[#c0392b]/[0.06] hover:bg-[#c0392b]/[0.1]"
            : "border-dashed border-[#8b6444]/55 bg-[#8b6444]/[0.07] hover:bg-[#8b6444]/[0.11]") +
          " " +
          (underlined ? "font-medium text-ink" : "font-semibold text-ink")
        }
      />
      {status === "saving" ? <Loader2 className="size-3 shrink-0 animate-spin text-ink/40" aria-hidden="true" /> : null}
      {status === "saved" ? <Check className="size-3 shrink-0 text-[#5f7a52]" aria-hidden="true" /> : null}
      {status === "error" ? (
        <span className="whitespace-nowrap text-[10px] font-medium text-[#8a2f24]">Couldn&apos;t save</span>
      ) : null}
    </span>
  );
}
