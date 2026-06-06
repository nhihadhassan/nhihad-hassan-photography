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
import { agreementDetailFields } from "@/data/booking-agreement";
import { getBookingAgreement } from "@/lib/booking-agreement";

export const metadata: Metadata = {
  title: "Booking Agreement",
  description: `Standard photography booking agreement for ${brandConfig.name}.`,
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const MONEY_FIELDS = new Set(["total", "deposit", "balance"]);

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function BookingAgreementPage({ searchParams }: Props) {
  const params = await searchParams;
  const { intro, disclaimer, sections } = await getBookingAgreement();

  const values: Record<string, string | undefined> = {};
  for (const field of agreementDetailFields) values[field.param] = first(params[field.param]);
  const detailRows = buildDetailRows(agreementDetailFields, values, MONEY_FIELDS);

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink print:bg-white">
      <div className="print:hidden">
        <SiteHeader tone="light" />
      </div>

      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8 print:pt-8">
        <AgreementDocument
          intro={intro}
          disclaimer={disclaimer}
          sections={sections}
          detailRows={detailRows}
          actionSlot={<PrintButton />}
          signatureSlot={<BlankSignatureBlock />}
        />
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
