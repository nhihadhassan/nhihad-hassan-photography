"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SignaturePad } from "@/components/signature-pad";
import { submitSignatureAction, type SignState } from "@/app/agreement/[token]/actions";

const initialState: SignState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none transition focus:border-[#8b6444]";

export function AgreementSignForm({
  token,
  defaultName,
  defaultEmail,
}: {
  token: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitSignatureAction, initialState);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => router.refresh(), 900);
      return () => clearTimeout(t);
    }
  }, [state.status, router]);

  if (state.status === "success") {
    return (
      <section className="mt-14 rounded-md border border-[#8b6444]/30 bg-white/60 p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-[#5f7a52]" aria-hidden="true" />
        <h2 className="mt-3 font-serif text-2xl text-ink">Agreement signed.</h2>
        <p className="mt-2 text-sm text-ink/65">Thank you. A copy is being prepared on this page.</p>
      </section>
    );
  }

  return (
    <section className="mt-14 break-inside-avoid">
      <h2 className="font-serif text-2xl text-ink">Sign the agreement</h2>
      <p className="mt-3 text-sm leading-7 text-ink/75">
        Type your full legal name and sign in the box below. Your name, signature, and the date and
        time are recorded as your electronic signature, with the same intent as a handwritten one.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="signature" value={signature ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Full legal name
            <input name="signer_name" defaultValue={defaultName} required className={inputClass} placeholder="First and last name" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Email
            <input name="signer_email" type="email" defaultValue={defaultEmail} className={inputClass} placeholder="you@example.com" />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink/80">Signature</p>
          <SignaturePad onChange={setSignature} />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-ink/75">
          <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-[#8b6444]" />
          <span>
            I have read and agree to this booking agreement, and I consent to signing it
            electronically.
          </span>
        </label>

        {state.status === "error" && state.message ? (
          <p className="rounded-md bg-[#8a2f24]/8 px-3 py-2 text-sm text-[#8a2f24]">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-soft-white transition hover:bg-ink/88 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Sign agreement
        </button>
      </form>
    </section>
  );
}
