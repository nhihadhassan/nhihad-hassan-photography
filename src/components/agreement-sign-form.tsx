"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { SignaturePad } from "@/components/signature-pad";
import { submitSignatureAction, type SignState } from "@/app/agreement/[token]/actions";
import type { AgreementSigner } from "@/lib/agreement-signers";
import type { AgreementClientDetails } from "@/lib/agreement-client-details";

const initialState: SignState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none transition focus:border-[#8b6444]";

export function AgreementSignForm({
  token,
  signers,
  photographerName,
  clientDetails,
}: {
  token: string;
  signers: AgreementSigner[];
  photographerName: string;
  clientDetails?: AgreementClientDetails;
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
        <h2 className="mt-3 font-serif text-2xl text-ink">Sent back to {photographerName}.</h2>
        <p className="mt-2 text-sm text-ink/65">{state.message}</p>
      </section>
    );
  }

  return (
    <section id="sign-contract" className="mt-14 scroll-mt-8 break-inside-avoid">
      <h2 className="font-serif text-3xl font-medium leading-none text-ink">Signatures</h2>
      <p className="mt-3 text-sm leading-7 text-ink/75">
        Complete your contact information, then sign and send the contract back to{" "}
        {photographerName}. Your name, signature, and the date and time are recorded as your
        electronic signature, with the same intent as a handwritten one.
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
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Contact number
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              defaultValue={clientDetails?.phone ?? ""}
              className={inputClass}
              placeholder="(416) 555-0123"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80 sm:col-span-2">
            Street address
            <input
              name="address_line_1"
              required
              autoComplete="address-line1"
              defaultValue={clientDetails?.addressLine1 ?? ""}
              className={inputClass}
              placeholder="Street number and name"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80 sm:col-span-2">
            Apartment or unit <span className="font-normal text-ink/60">(optional)</span>
            <input
              name="address_line_2"
              autoComplete="address-line2"
              defaultValue={clientDetails?.addressLine2 ?? ""}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            City
            <input
              name="city"
              required
              autoComplete="address-level2"
              defaultValue={clientDetails?.city ?? ""}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Province
            <input
              name="province"
              required
              autoComplete="address-level1"
              defaultValue={clientDetails?.province ?? "Ontario"}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/80">
            Postal code
            <input
              name="postal_code"
              required
              autoComplete="postal-code"
              defaultValue={clientDetails?.postalCode ?? ""}
              className={inputClass}
              placeholder="A1A 1A1"
            />
          </label>
        </div>

        <fieldset className="border-t border-ink/12 pt-5">
          <legend className="text-sm font-semibold text-ink">Backup contact</legend>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            Optional, useful if you cannot be reached on the event day.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-ink/80">
              Name
              <input name="backup_name" autoComplete="off" defaultValue={clientDetails?.backupName ?? ""} className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink/80">
              Contact number
              <input name="backup_phone" type="tel" autoComplete="off" defaultValue={clientDetails?.backupPhone ?? ""} className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink/80 sm:col-span-2">
              Email <span className="font-normal text-ink/60">(optional)</span>
              <input name="backup_email" type="email" autoComplete="off" defaultValue={clientDetails?.backupEmail ?? ""} className={inputClass} />
            </label>
          </div>
        </fieldset>

        <div className="flex gap-3 rounded-md border border-ink/12 bg-[#f5f0e8] px-4 py-3">
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#8b6444]" aria-hidden="true" />
          <p className="text-xs leading-5 text-ink/70">
            Your information is encrypted while it is sent and stored behind restricted access. It
            is used only to manage your booking, fulfill this agreement, and maintain required
            records.
          </p>
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
          Sign and send back
        </button>
      </form>
    </section>
  );
}
