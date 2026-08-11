import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AgreementDocument } from "@/components/agreement-document";
import { AgreementEmailComposer } from "@/components/agreement-email-composer";
import { buildAgreementView } from "@/lib/agreement-view";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import { getAgreementRequestById, getSignedAgreementsByToken } from "@/lib/agreements";
import { agreementSignUrl } from "@/lib/agreement-url";
import { missingContactFields } from "@/lib/agreement-values";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview contract",
  robots: { index: false, follow: false },
};

function formatTorontoDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

/**
 * Read-only rehearsal of a contract send: the exact email each signer will get
 * and the contract as they will see it. Reading this page does not mark the
 * contract viewed the way opening the client link does.
 */
export default async function AgreementPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const request = await getAgreementRequestById(id);
  if (!request) notFound();

  const signatures = await getSignedAgreementsByToken(request.token);
  const view = await buildAgreementView(request, signatures);
  const agreementUrl = agreementSignUrl(request.token);

  const recipients = [
    { name: request.client_name, email: request.client_email },
    { name: request.details.secondSignerName ?? null, email: request.details.secondSignerEmail ?? null },
  ].filter((recipient): recipient is { name: string | null; email: string } => Boolean(recipient.email));

  const missingFields = missingContactFields(request.details);

  const blockedReason = request.revoked_at
    ? "This signing link has been revoked, so it can no longer be emailed."
    : view.fullySigned
      ? "This contract is already signed. Nothing further needs to be sent."
      : isAgreementPastExpiry(request)
        ? "This contract has expired and can no longer be emailed."
        : !recipients.length
          ? "No signer email is saved on this contract, so there is nobody to send it to."
          : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/agreements"
        className="inline-flex items-center gap-2 text-sm text-admin-ink/60 transition hover:text-admin-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to contracts
      </Link>

      <div className="mt-4">
        <p className="text-sm font-medium text-admin-accent">Preview before sending</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">{view.contractTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Review the contract, personalize the email if you like, and send. Nothing has been sent
          yet, and opening this page does not mark the contract as viewed.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="admin-display text-xl text-admin-ink">Who it goes to</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {recipients.length ? (
            recipients.map((recipient) => (
              <li
                key={recipient.email}
                className="rounded-md border border-admin-ink/10 bg-admin-surface px-4 py-3"
              >
                <p className="text-sm font-medium text-admin-ink">{recipient.name ?? "Signer"}</p>
                <p className="text-sm text-admin-ink/60">{recipient.email}</p>
              </li>
            ))
          ) : (
            <li className="rounded-md border border-admin-danger/20 bg-admin-danger/5 px-4 py-3 text-sm text-admin-danger">
              No signer email saved on this contract.
            </li>
          )}
        </ul>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-admin-ink/60">
          <div>
            <dt className="inline font-medium text-admin-ink/75">Signing link: </dt>
            <dd className="inline break-all font-mono text-xs">{agreementUrl}</dd>
          </div>
          {request.expires_at ? (
            <div>
              <dt className="inline font-medium text-admin-ink/75">Signing deadline: </dt>
              <dd className="inline">{formatTorontoDateTime(request.expires_at)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="admin-display text-xl text-admin-ink">The contract</h2>
          <a
            href={agreementUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Open the real signing page
          </a>
        </div>
        <p className="mt-2 text-xs text-admin-ink/50">
          Opening the real signing page stamps it as viewed by the client. Use this preview instead
          unless you need to test the signature form.
        </p>
        <div className="mt-4 overflow-hidden rounded-md border border-admin-ink/10 bg-[#fbfaf7] text-ink">
          <AgreementDocument
            title={view.title}
            intro={view.intro}
            sections={view.sections}
            detailRows={view.detailRows}
            serviceRows={view.serviceRows}
            feeRows={view.feeRows}
            agreementValues={view.values}
            referenceFormatting={view.referenceFormatting}
            depositTerm={view.depositTerm}
          />
        </div>
      </section>

      <section id="send" className="mt-8 scroll-mt-24 border-t border-admin-line pt-6">
        <h2 className="admin-display text-xl text-admin-ink">The email</h2>
        <p className="mt-1 text-sm text-admin-muted">
          A good default is filled in already — edit it if you want to add a personal note, or send
          as is.
        </p>
        <div className="mt-4">
          <AgreementEmailComposer
            requestId={request.id}
            recipients={recipients}
            agreementUrl={agreementUrl}
            expiresAt={request.expires_at}
            missingFields={missingFields}
            savedSubject={request.invite_subject}
            savedMessage={request.invite_message}
            alreadySent={Boolean(request.sent_at || request.latest_delivery)}
            disabledReason={blockedReason}
          />
        </div>
      </section>
    </div>
  );
}
