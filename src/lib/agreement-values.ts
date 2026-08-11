import type { AgreementDetails, ClientEditableField } from "@/lib/agreements";
import { brandConfig } from "@/lib/config";

/**
 * Maps a client identity + AgreementDetails into the flat `{{token}}` lookup
 * record every contract renderer (signing page, admin preview, PDF, and the
 * document-first agreement builder) reads from. No "server-only" here since
 * the builder recomputes this client-side on every keystroke.
 */
export function buildAgreementValues(
  clientName: string | null | undefined,
  clientEmail: string | null | undefined,
  details: AgreementDetails,
): Record<string, string | undefined> {
  return {
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
    photographerName: brandConfig.ownerName,
    photographerBusinessName: brandConfig.name,
  };
}

/**
 * Contact fields the contract text references ({{clientPhone}}, {{clientAddress}})
 * that the photographer left blank when drafting this agreement, so the
 * agreement email can ask the client to supply them before signing.
 */
export function missingContactFields(details: AgreementDetails): string[] {
  const missing: string[] = [];
  if (!details.phone?.trim()) missing.push("phone number");
  if (!details.clientAddress?.trim()) missing.push("mailing address");
  return missing;
}

/**
 * Every field the client can fill in inline on the signing page
 * (AgreementInlineField) that's still blank, in the order they appear on
 * the document. Drives the "before you sign" banner so a blank field isn't
 * just a quiet highlighted box the client has to notice on their own.
 */
export function missingClientFields(
  details: AgreementDetails,
): { param: ClientEditableField; label: string }[] {
  const checks: { param: ClientEditableField; label: string }[] = [
    { param: "startTime", label: "start time" },
    { param: "location", label: "venue and full address" },
    { param: "phone", label: "phone number" },
    { param: "clientAddress", label: "mailing address" },
  ];
  return checks.filter((check) => !details[check.param]?.trim());
}
