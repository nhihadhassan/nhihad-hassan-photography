import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { PrintButton } from "@/components/print-button";
import { AgreementDocument, buildDetailRows } from "@/components/agreement-document";
import { AgreementSignForm } from "@/components/agreement-sign-form";
import { agreementDetailFields } from "@/data/booking-agreement";
import { getBookingAgreement } from "@/lib/booking-agreement";
import { getAgreementRequestByToken, getSignedAgreementByToken } from "@/lib/agreements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign your booking agreement",
  robots: { index: false, follow: false },
};

const MONEY_FIELDS = new Set(["total", "deposit", "balance"]);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Unavailable() {
  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <main className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col justify-center px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>
        <h1 className="mt-12 font-serif text-5xl leading-[0.95] text-ink sm:text-6xl">
          This agreement link is unavailable.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink/68">
          The link may have expired, been replaced, or been turned off. Please get in touch if you
          need a new one.
        </p>
        <div className="mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
          >
            Contact Nhihad
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default async function AgreementSigningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getAgreementRequestByToken(token);
  if (!request) return <Unavailable />;

  const [terms, signed] = await Promise.all([
    getBookingAgreement(),
    getSignedAgreementByToken(token),
  ]);

  const values: Record<string, string | undefined> = {
    client: request.client_name ?? undefined,
    email: request.client_email ?? undefined,
    type: request.details.type,
    date: request.details.date,
    location: request.details.location,
    total: request.details.total,
    deposit: request.details.deposit,
    balance: request.details.balance,
    window: request.details.window,
  };
  const detailRows = buildDetailRows(agreementDetailFields, values, MONEY_FIELDS);

  const signatureSlot = signed ? (
    <section className="mt-14 break-inside-avoid">
      <h2 className="font-serif text-2xl text-ink">Signed</h2>
      <p className="mt-3 text-sm leading-7 text-ink/75">
        Signed electronically by {signed.signer_name} on {formatDateTime(signed.signed_at)}.
      </p>
      {signed.signature_data_url ? (
        <div className="mt-5 inline-block rounded-md border border-ink/15 bg-white p-3">
          <Image
            src={signed.signature_data_url}
            alt={`Signature of ${signed.signer_name}`}
            width={360}
            height={120}
            unoptimized
            className="h-24 w-auto"
          />
        </div>
      ) : null}
      <p className="mt-4 text-xs text-ink/45">
        This record is kept by the photographer as confirmation of your agreement.
      </p>
    </section>
  ) : (
    <AgreementSignForm
      token={token}
      defaultName={request.client_name ?? ""}
      defaultEmail={request.client_email ?? ""}
    />
  );

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink print:bg-white">
      <main className="px-4 pb-20 pt-16 sm:px-6 lg:px-8 print:pt-8">
        <div className="mx-auto mb-8 max-w-3xl print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </div>
        <AgreementDocument
          intro={terms.intro}
          disclaimer={terms.disclaimer}
          sections={terms.sections}
          detailRows={detailRows}
          actionSlot={<PrintButton />}
          signatureSlot={signatureSlot}
        />
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
