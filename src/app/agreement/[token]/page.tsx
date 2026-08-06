import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { PrintButton } from "@/components/print-button";
import { AgreementDocument, buildDetailRows } from "@/components/agreement-document";
import { AgreementSignForm } from "@/components/agreement-sign-form";
import { agreementDetailFields } from "@/data/booking-agreement";
import { resolveAgreementTemplateId } from "@/data/wedding-agreement";
import { getBookingAgreement } from "@/lib/booking-agreement";
import { brandConfig } from "@/lib/config";
import {
  getAgreementCover,
  getAgreementRequestByToken,
  getSignedAgreementByToken,
} from "@/lib/agreements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign your booking agreement",
  robots: { index: false, follow: false },
};

const MONEY_FIELDS = new Set(["total", "deposit", "balance"]);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "long",
    day: "numeric",
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

  const [signed, cover] = await Promise.all([
    getSignedAgreementByToken(token),
    getAgreementCover(request.gallery_id),
  ]);
  const snapshot = signed?.agreement_snapshot;
  const signedTerms = snapshot?.sections?.length ? snapshot : null;
  const agreementDetails = signedTerms ? signedTerms.details : request.details;
  const clientName = signedTerms ? signedTerms.clientName : request.client_name;
  const clientEmail = signedTerms ? signedTerms.clientEmail : request.client_email;
  const terms = signedTerms
    ? {
        intro: signedTerms.intro,
        disclaimer: signedTerms.disclaimer,
        sections: signedTerms.sections,
      }
    : await getBookingAgreement(
        agreementDetails.template,
        clientName ?? "",
        agreementDetails.partner,
      );
  const firstName = clientName?.trim().split(/\s+/)[0] || "there";
  const contractTitle = `${clientName?.trim() || agreementDetails.type?.trim() || "Photography"} Contract`;

  const values: Record<string, string | undefined> = {
    client: clientName ?? undefined,
    partner: agreementDetails.partner,
    email: clientEmail ?? undefined,
    type: agreementDetails.type,
    date: agreementDetails.date,
    location: agreementDetails.location,
    total: agreementDetails.total,
    deposit: agreementDetails.deposit,
    balance: agreementDetails.balance,
    window: agreementDetails.window,
  };
  const templateId = resolveAgreementTemplateId(agreementDetails.template);
  const detailFields =
    templateId === "wedding"
      ? agreementDetailFields
      : agreementDetailFields.filter((field) => field.param !== "partner");
  const detailRows = buildDetailRows(detailFields, values, MONEY_FIELDS);

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
    <div className="min-h-[100dvh] bg-[#f1f0ed] text-ink print:bg-white">
      <header className="relative h-[600px] overflow-hidden bg-charcoal text-soft-white print:hidden sm:h-[560px]">
        <Image
          src={cover?.url || "/portfolio/ma-baby-shower-couple.webp"}
          alt={cover?.alt || "An expecting couple photographed by Nhihad Hassan Photography"}
          fill
          priority
          quality={90}
          unoptimized={Boolean(cover?.url?.startsWith("http"))}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: `${cover?.focalX ?? 50}% ${Math.max(0, (cover?.focalY ?? 50) - 10)}%` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,.48),rgba(8,8,8,.14)_45%,rgba(8,8,8,.6))]" />
        <div className="relative mx-auto h-full max-w-6xl px-5 sm:px-8">
          <div className="pt-6 text-center sm:pt-7">
            <p className="font-serif text-[clamp(1.05rem,5.5vw,2.8rem)] uppercase tracking-normal text-soft-white">
              {brandConfig.name}
            </p>
            <h1 className="mt-40 font-serif text-[clamp(2.75rem,5vw,4.75rem)] font-medium leading-[0.92] sm:mt-[5.75rem]">
              Hi {firstName},
            </h1>
            <p className="mt-3 font-serif text-[clamp(1.65rem,3vw,2.75rem)] leading-[1.08] text-soft-white/92">
              Please review and sign this contract.
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-24 sm:px-6 lg:px-8 print:px-0 print:pb-0">
        <section className="mx-auto -mt-[180px] max-w-[800px] bg-[#fbfaf7] px-6 py-8 shadow-[0_18px_48px_rgba(31,25,19,0.14)] print:hidden sm:-mt-[216px] sm:px-12 sm:py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-3xl font-medium leading-none sm:text-4xl">{contractTitle}</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${signed ? "bg-[#66805d]/8 text-[#52694b]" : "bg-copper/8 text-[#776f98]"}`}>
                  {signed ? <Check className="size-3" aria-hidden="true" /> : null}
                  {signed ? "Signed" : "Awaiting signature"}
                </span>
              </div>
            </div>
            <PrintButton className="shrink-0 rounded-none border-0 px-0 underline decoration-ink/20 underline-offset-4 hover:border-0" />
          </div>

          <dl className={`mt-7 grid gap-5 ${request.expires_at && !signed ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">From</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink/85">{brandConfig.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">To</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink/85">{clientName || "Client"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">Issue date</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink/85">{formatDate(request.sent_at || request.created_at)}</dd>
            </div>
            {request.expires_at && !signed ? (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                  Sign by
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-ink/85">
                  {formatDateTime(request.expires_at)}
                </dd>
              </div>
            ) : null}
          </dl>

          <a
            href="#sign-contract"
            aria-disabled={Boolean(signed)}
            className={`mt-12 flex min-h-[60px] w-full items-center justify-center px-5 text-xs font-semibold uppercase tracking-[0.18em] transition ${signed ? "pointer-events-none bg-[#66805d] text-soft-white" : "bg-ink text-soft-white hover:bg-ink/88"}`}
          >
            {signed ? <Check className="mr-2 size-4" aria-hidden="true" /> : null}
            {signed ? "Contract signed" : "Sign contract"}
          </a>
        </section>

        <div className="mx-auto mt-4 max-w-[800px] bg-[#fbfaf7] shadow-[0_14px_40px_rgba(31,25,19,0.06)] print:mt-0 print:max-w-none print:shadow-none sm:mt-5">
          <AgreementDocument
            title={
              templateId === "wedding"
                ? "Wedding Photography Services Agreement"
                : "Photography Services Agreement"
            }
            intro={terms.intro}
            sections={terms.sections}
            detailRows={detailRows}
            signatureSlot={signatureSlot}
          />
        </div>
      </main>
    </div>
  );
}
