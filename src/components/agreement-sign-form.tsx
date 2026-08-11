"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SignaturePad } from "@/components/signature-pad";
import { submitSignatureAction, type SignState } from "@/app/agreement/[token]/actions";
import type { AgreementSigner } from "@/lib/agreement-signers";

const initialState: SignState = { status: "idle", message: "" };

/**
 * One card per required signer, so a two-signer contract shows both names up
 * front instead of asking whoever opens the link to pick themselves from a
 * list. Signing one does not affect the other: the page re-derives the
 * remaining signers from the server after a refresh, so a completed card
 * simply stops appearing here and moves into "Signatures received" above.
 *
 * Interactive end to end (pad, checkbox, submit button), so it is print-hidden
 * entirely; PrintableSignatureLine below is what an unsigned contract shows
 * on paper instead.
 */
function SignerCard({
  token,
  signer,
  photographerName,
}: {
  token: string;
  signer: AgreementSigner;
  photographerName: string;
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
      <div className="border border-[#8b6444]/30 bg-white/60 p-6 text-center print:hidden">
        <CheckCircle2 className="mx-auto size-8 text-[#5f7a52]" aria-hidden="true" />
        <p className="mt-3 font-serif text-xl text-ink">Sent back to {photographerName}.</p>
        <p className="mt-2 text-sm text-ink/65">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="border border-ink/12 bg-white/55 p-5 print:hidden">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="signature" value={signature ?? ""} />
      <input type="hidden" name="signer_name" value={signer.name} />
      <input type="hidden" name="signer_email" value={signer.email} />

      <p className="text-sm font-semibold text-ink">{signer.name}</p>

      <div className="mt-3">
        <SignaturePad onChange={setSignature} defaultName={signer.name} />
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-ink/75">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-[#8b6444]" />
        <span>
          I am {signer.name}. I have read and agree to this booking agreement, and I consent to
          signing it electronically.
        </span>
      </label>

      {state.status === "error" && state.message ? (
        <p className="mt-3 rounded-md bg-[#8a2f24]/8 px-3 py-2 text-sm text-[#8a2f24]">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-ink px-6 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition hover:bg-ink/88 disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Sign as {signer.name}
      </button>
    </form>
  );
}

/** Print-only stand-in for an unsigned SignerCard: a name and blank lines to sign by hand. */
function PrintableSignatureLine({ signer }: { signer: AgreementSigner }) {
  return (
    <div className="hidden break-inside-avoid print:block">
      <p className="text-[10.5pt] font-semibold text-ink">{signer.name}</p>
      <div className="mt-8 border-t border-ink/40" />
      <p className="mt-1 text-[8pt] text-ink/55">Signature</p>
      <div className="mt-8 border-t border-ink/40" />
      <p className="mt-1 text-[8pt] text-ink/55">Date</p>
    </div>
  );
}

export function AgreementSignForm({
  token,
  signers,
  photographerName,
}: {
  token: string;
  signers: AgreementSigner[];
  photographerName: string;
}) {
  if (!signers.length) return null;
  const names = signers.map((signer) => signer.name).filter(Boolean);

  return (
    <section id="sign-contract" className="mt-14 scroll-mt-8">
      <h2 className="font-serif text-3xl font-medium leading-none text-ink print:hidden">Signatures</h2>
      <p className="mt-3 text-sm leading-7 text-ink/75 print:hidden">
        {names.length > 1
          ? `This agreement needs signatures from ${names.join(" and ")}.`
          : `Sign below to send this contract back to ${photographerName}.`}{" "}
        Your name, signature, and the date and time are recorded as your electronic signature,
        with the same intent as a handwritten one.
      </p>

      <h2 className="hidden break-after-avoid text-ink print:mt-14 print:block print:text-[14pt]">
        Signatures
      </h2>
      <p className="hidden text-ink/75 print:mt-3 print:block print:text-[10.5pt] print:leading-[1.5]">
        By signing below, {names.length > 1 ? names.join(" and ") : names[0]} agree
        {names.length > 1 ? "" : "s"} to the terms set out in this agreement.
      </p>

      <div className="mt-6 space-y-5 print:hidden">
        {signers.map((signer) => (
          <SignerCard key={signer.email} token={token} signer={signer} photographerName={photographerName} />
        ))}
      </div>
      <div className="hidden print:mt-8 print:grid print:grid-cols-2 print:gap-10">
        {signers.map((signer) => (
          <PrintableSignatureLine key={signer.email} signer={signer} />
        ))}
      </div>
    </section>
  );
}
