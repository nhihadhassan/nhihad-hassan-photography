"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitMissingDetailsAction, type MissingDetailsState } from "@/app/agreement/[token]/actions";

const initialState: MissingDetailsState = { status: "idle", message: "" };

const fieldClass =
  "min-h-11 w-full rounded-sm border border-ink/20 bg-white/70 px-3 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-[#8b6444]";

/**
 * Shown above the signature form when the contract still has blanks only the
 * client can fill: their phone number and/or mailing address. Saves straight
 * to the agreement so the fields are already in place by the time they sign,
 * instead of asking them to reply to the email.
 */
export function AgreementMissingDetailsForm({
  token,
  missingPhone,
  missingAddress,
}: {
  token: string;
  missingPhone: boolean;
  missingAddress: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitMissingDetailsAction, initialState);
  const saved = state.status === "success";

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => router.refresh(), 700);
      return () => clearTimeout(t);
    }
  }, [saved, router]);

  if (!missingPhone && !missingAddress) return null;

  if (saved) {
    return (
      <div className="mt-6 flex items-center gap-2.5 border border-[#8b6444]/30 bg-white/60 p-4 text-sm text-ink/75 print:hidden">
        <CheckCircle2 className="size-5 shrink-0 text-[#5f7a52]" aria-hidden="true" />
        Saved. Those spots on the agreement are filled in below.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 border border-ink/12 bg-white/55 p-5 print:hidden">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm font-semibold text-ink">Please fill out:</p>
      <ul className="mt-3 space-y-3">
        {missingPhone ? (
          <li>
            <label className="grid gap-1.5 text-sm text-ink/75">
              Your phone number
              <input name="phone" type="tel" autoComplete="tel" className={fieldClass} placeholder="(416) 555-0142" />
            </label>
          </li>
        ) : null}
        {missingAddress ? (
          <li>
            <label className="grid gap-1.5 text-sm text-ink/75">
              Your mailing address
              <input
                name="clientAddress"
                type="text"
                autoComplete="street-address"
                className={fieldClass}
                placeholder="Street, city, province, postal code"
              />
            </label>
          </li>
        ) : null}
      </ul>

      {state.status === "error" && state.message ? (
        <p className="mt-3 rounded-sm bg-[#8a2f24]/8 px-3 py-2 text-sm text-[#8a2f24]">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm bg-ink px-5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition hover:bg-ink/88 disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Save
      </button>
    </form>
  );
}
