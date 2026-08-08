import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAgreementRequestById, getSignedAgreementsByToken } from "@/lib/agreements";
import { buildAgreementView } from "@/lib/agreement-view";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import { getPricing } from "@/lib/pricing";
import { AgreementBuilder } from "@/components/agreement-builder";

export const dynamic = "force-dynamic";

/**
 * The document-first agreement builder: fill in a real contract's variables
 * directly on the rendered document. Only reachable for an active, unsigned
 * draft — the same guard updateAgreementIdentity enforces server-side, so a
 * signed/revoked/expired agreement always falls back to the read-only
 * preview instead of a broken editor.
 */
export default async function AgreementEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const request = await getAgreementRequestById(id);
  if (!request) notFound();

  const inactive =
    Boolean(request.signed_at || request.revoked_at || request.client_submitted_at) ||
    isAgreementPastExpiry(request);
  if (inactive) redirect(`/admin/agreements/${id}/preview`);

  const signatures = await getSignedAgreementsByToken(request.token);
  const view = await buildAgreementView(request, signatures);
  const pricing = await getPricing();

  return (
    <AgreementBuilder
      requestId={request.id}
      clientName={request.client_name ?? ""}
      clientEmail={request.client_email ?? ""}
      details={request.details}
      message={request.message ?? ""}
      title={view.title}
      intro={view.intro}
      sections={view.sections}
      depositTerm={view.depositTerm}
      pricing={pricing}
    />
  );
}
