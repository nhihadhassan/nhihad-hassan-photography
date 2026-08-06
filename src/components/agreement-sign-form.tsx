"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SignaturePad } from "@/components/signature-pad";
import { submitSignatureAction, type SignState } from "@/app/agreement/[token]/actions";
import type { AgreementSigner } from "@/lib/agreement-signers";

const initialState: SignState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none transition focus:border-[#8b6444]";

export function AgreementSignForm({
  token,
  signers,
}: {
  token: string;
  signers: AgreementSigner[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitSignatureAction, initialState);
  const [signature, setSignature] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState(signers[0]?.email ?? "");
  const selectedSigner = useMemo(
    () => signers.find((signer) => signer.email === selectedEmail) ?? signers[0],
    [selectedEmail, signers],
  );

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => router.refresh(), 900);
      return () => clearTimeout(t);
    }
  }, [state.status, router]);

  if (state.status === "success") {
    return (
      <section id="sign-contract" className="mt-14 rounded-md border border-[#8b6444]/30 bg-white/60 p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-[#5f7a52]" aria-hidden="true" />
        <h2 className="mt-3 font-serif text-2xl text-ink">Signature recorded.</h2>
        <p className="mt-2 text-sm text-ink/65">{state.message}</p>
      </section>
    );
  }

  return (
    <section id="sign-contract" className="mt-14 scroll-mt-8 break-inside-avoid">
      <h2 className="font-serif text-3xl font-medium leading-none text-ink">Signatures</h2>
      <p className="mt-3 text-sm leading-7 text-ink/75">
        Choose your name and sign in the box below. Your name, signature, and the date and
        time are recorded as your electronic signature, with the same intent as a handwritten one.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="signature" value={signature ?? ""} />
        <input type="hidden" name="signer_name" value={selectedSigner?.name ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Signing as
            <select
              name="signer_email"
              value={selectedSigner?.email ?? ""}
              onChange={(event) => setSelectedEmail(event.target.value)}
              required={signers.length > 1}
              className={inputClass}
            >
              {signers.map((signer) => (
                <option key={signer.email} value={signer.email}>{signer.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Email
            <input type="email" value={selectedSigner?.email ?? ""} readOnly className={`${inputClass} bg-ink/[0.035]`} />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink/80">Signature</p>
          <SignaturePad onChange={setSignature} />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-ink/75">
          <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-[#8b6444]" />
          <span>
            I am {selectedSigner?.name || "the selected signer"}. I have read and agree to this booking agreement, and I consent to signing it
            electronically.
          </span>
        </label>

        {state.status === "error" && state.message ? (
          <p className="rounded-md bg-[#8a2f24]/8 px-3 py-2 text-sm text-[#8a2f24]">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 bg-ink px-6 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition hover:bg-ink/88 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Sign agreement
        </button>
      </form>
    </section>
  );
}
