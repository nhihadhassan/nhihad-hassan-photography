import "server-only";
import { buildDetailRows, type DetailRow } from "@/components/agreement-document";
import {
  agreementDetailFields,
  agreementFeeFields,
  agreementServiceFields,
  legacyAgreementDetailFields,
  sectionTwoAgreementDetailFields,
  type AgreementSection,
} from "@/data/booking-agreement";
import { resolveAgreementTemplateId, type AgreementTemplateId } from "@/data/wedding-agreement";
import { getBookingAgreement } from "@/lib/booking-agreement";
import type { AgreementDetails, AgreementRequest, SignedAgreement } from "@/lib/agreements";
import { remainingAgreementSigners, requiredAgreementSigners, type AgreementSigner } from "@/lib/agreement-signers";

const MONEY_FIELDS = new Set(["total", "hourly", "deposit", "balance"]);

/**
 * Service rows that are optional in practice. An empty one is dropped rather
 * than printed as a fill-in blank, so a contract sent to a client never shows a
 * dangling "Restrictions and special requests: ____" line.
 */
const OPTIONAL_SERVICE_FIELDS = new Set(["specialRequests", "secondLocation"]);

export type AgreementView = {
  templateId: AgreementTemplateId;
  title: string;
  contractTitle: string;
  firstName: string;
  clientName: string | null;
  clientEmail: string | null;
  details: AgreementDetails;
  intro: string;
  disclaimer: string;
  sections: AgreementSection[];
  values: Record<string, string | undefined>;
  detailRows: DetailRow[];
  serviceRows?: DetailRow[];
  feeRows?: DetailRow[];
  referenceFormatting: boolean;
  depositTerm: "Retainer" | "Deposit";
  requiredSigners: AgreementSigner[];
  remainingSigners: AgreementSigner[];
  fullySigned: boolean;
};

/**
 * Everything needed to render a contract for one signing request. Signed
 * requests render from the stored snapshot; unsigned ones render live template
 * content, so an admin preview shows exactly what the client will receive.
 */
export async function buildAgreementView(
  request: AgreementRequest,
  signatures: SignedAgreement[] = [],
): Promise<AgreementView> {
  const snapshot = signatures[0]?.agreement_snapshot;
  const signedTerms = snapshot?.sections?.length ? snapshot : null;
  const details = signedTerms ? signedTerms.details : request.details;
  const clientName = signedTerms ? signedTerms.clientName : request.client_name;
  const clientEmail = signedTerms ? signedTerms.clientEmail : request.client_email;

  const terms = signedTerms
    ? { intro: signedTerms.intro, disclaimer: signedTerms.disclaimer, sections: signedTerms.sections }
    : await getBookingAgreement(
        details.template,
        clientName ?? "",
        details.partner,
        details.secondSignerName,
        details.rehostingFee === "0",
      );

  const values: Record<string, string | undefined> = {
    ...details,
    client: clientName ?? undefined,
    partner: details.partner,
    effectiveDate: details.effectiveDate,
    clientAddress: details.clientAddress,
    email: clientEmail ?? undefined,
    phone: details.phone,
    type: details.type,
    description: details.description ?? details.type,
    date: details.date,
    location: details.location,
    city: details.city,
    cancellationNoticeDays: details.cancellationNoticeDays,
    mealHours: details.mealHours,
    total: details.total,
    hourly: details.hourly,
    deposit: details.deposit,
    balance: details.balance,
    balanceDueDate: details.balanceDueDate,
    lateFeePercent: details.lateFeePercent,
    window: details.window,
    clientName: clientName ?? undefined,
    partnerName: details.partner,
    galleryWindow: details.window,
    clientEmail: clientEmail ?? undefined,
    clientPhone: details.phone,
    secondSignerName: details.secondSignerName,
    secondSignerEmail: details.secondSignerEmail,
    secondSignerPhone: details.secondSignerPhone,
  };

  const templateId = resolveAgreementTemplateId(details.template);
  const referenceFormatting =
    !signedTerms || ["reference-v1", "reference-v2"].includes(details.presentationVersion ?? "");
  const usesSectionTwoFees = !signedTerms || details.feeStructureVersion === "section-2";
  const fieldsForLayout = referenceFormatting
    ? agreementDetailFields
    : usesSectionTwoFees
      ? sectionTwoAgreementDetailFields
      : legacyAgreementDetailFields;
  const detailFields =
    templateId === "wedding"
      ? fieldsForLayout
      : fieldsForLayout.filter((field) => field.param !== "partner");

  const serviceFields = agreementServiceFields
    .filter((field) => !OPTIONAL_SERVICE_FIELDS.has(field.param) || (values[field.param] ?? "").trim())
    .map((field) =>
      templateId === "wedding" && field.param === "date"
        ? { ...field, label: "Date of wedding" }
        : templateId === "wedding" && field.param === "location"
          ? { ...field, label: "Location of wedding" }
          : field,
    );

  const requiredSigners = requiredAgreementSigners(request);
  const remainingSigners = remainingAgreementSigners(
    requiredSigners,
    signatures.map((signature) => signature.signer_email),
  );

  return {
    templateId,
    title:
      templateId === "wedding"
        ? "Wedding Photography Services Agreement"
        : "Photography Services Agreement",
    contractTitle: `${clientName?.trim() || details.type?.trim() || "Photography"} Contract`,
    firstName: clientName?.trim().split(/\s+/)[0] || "there",
    clientName,
    clientEmail,
    details,
    intro: terms.intro,
    disclaimer: terms.disclaimer,
    sections: terms.sections,
    values,
    detailRows: buildDetailRows(detailFields, values, MONEY_FIELDS),
    serviceRows: referenceFormatting ? buildDetailRows(serviceFields, values, MONEY_FIELDS) : undefined,
    feeRows: usesSectionTwoFees ? buildDetailRows(agreementFeeFields, values, MONEY_FIELDS) : undefined,
    referenceFormatting,
    depositTerm: templateId === "wedding" ? "Deposit" : "Retainer",
    requiredSigners,
    remainingSigners,
    fullySigned:
      Boolean(request.signed_at) || (requiredSigners.length > 0 && remainingSigners.length === 0),
  };
}
