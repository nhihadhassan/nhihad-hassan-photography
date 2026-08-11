"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { submitMissingDetailsAction } from "@/app/agreement/[token]/actions";

const SAVE_DELAY_MS = 900;

/**
 * A contract blank the client fills in directly on the document, the same
 * way a paper contract works, instead of a separate "please reply with"
 * form bolted on top. Autosaves to the agreement (token-scoped, limited to
 * phone/mailing address) so what's on the page is always what's saved.
 */
export function AgreementInlineField({
  token,
  param,
  value,
  label,
  underlined = false,
}: {
  token: string;
  param: "phone" | "clientAddress";
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

  return (
    <span className="relative inline-flex items-baseline gap-1 align-baseline">
      <input
        type={param === "phone" ? "tel" : "text"}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={`Your ${label}`}
        style={{ width }}
        className={
          "max-w-full rounded-sm border-0 border-b-2 border-dashed border-[#8b6444]/55 bg-[#8b6444]/[0.07] px-1 outline-none transition placeholder:font-normal placeholder:text-ink/40 hover:bg-[#8b6444]/[0.11] focus:border-[#8b6444] focus:bg-[#8b6444]/[0.14] " +
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
