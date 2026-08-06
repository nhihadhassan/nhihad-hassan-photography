import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PrintButton } from "@/components/print-button";
import {
  AgreementDocument,
  BlankSignatureBlock,
  buildDetailRows,
} from "@/components/agreement-document";
import { brandConfig } from "@/lib/config";
import { agreementDetailFields, agreementFeeFields, agreementFields, agreementServiceFields } from "@/data/booking-agreement";
import { resolveAgreementTemplateId } from "@/data/wedding-agreement";
import { getBookingAgreement } from "@/lib/booking-agreement";

export const metadata: Metadata = {
  title: "Booking Agreement",
  description: `Standard photography booking agreement for ${brandConfig.name}.`,
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const MONEY_FIELDS = new Set(["total", "hourly", "deposit", "balance"]);

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function BookingAgreementPage({ searchParams }: Props) {
  const params = await searchParams;
  const values: Record<string, string | undefined> = {};
  for (const field of agreementFields) values[field.param] = first(params[field.param]);
  values.description ||= values.type;
  values.clientName = values.client;
  values.partnerName = values.partner;
  values.galleryWindow = values.window;
  values.clientEmail = values.email;
  const templateId = resolveAgreementTemplateId(first(params.template));
  const { intro, sections } = await getBookingAgreement(
    templateId,
    values.client,
    values.partner,
  );
  const detailFields =
    templateId === "wedding"
      ? agreementDetailFields
      : agreementDetailFields.filter((field) => field.param !== "partner");
  const detailRows = buildDetailRows(detailFields, values, MONEY_FIELDS);
  const feeRows = buildDetailRows(agreementFeeFields, values, MONEY_FIELDS);
  const serviceFields = agreementServiceFields.map((field) =>
    templateId === "wedding" && field.param === "date"
      ? { ...field, label: "Date of wedding" }
      : templateId === "wedding" && field.param === "location"
        ? { ...field, label: "Location of wedding" }
        : field,
  );
  const serviceRows = buildDetailRows(serviceFields, values, MONEY_FIELDS);

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink print:bg-white">
      <div className="print:hidden">
        <SiteHeader tone="light" />
      </div>

      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8 print:pt-8">
        <div className="mx-auto max-w-3xl bg-white shadow-[0_20px_60px_rgba(36,28,20,0.08)] print:shadow-none">
          <AgreementDocument
            title={
              templateId === "wedding"
                ? "Wedding Photography Services Agreement"
                : "Photography Services Agreement"
            }
            intro={intro}
            sections={sections}
            detailRows={detailRows}
            serviceRows={serviceRows}
            feeRows={feeRows}
            agreementValues={values}
            referenceFormatting
            actionSlot={<PrintButton />}
            signatureSlot={<BlankSignatureBlock />}
          />
        </div>
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
