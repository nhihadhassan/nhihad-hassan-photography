import type { Metadata } from "next";
import { QuotePreview } from "@/components/quote-preview";

export const metadata: Metadata = {
  title: "Photography Quote",
  robots: { index: false, follow: false },
};

export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <QuotePreview token={token} />;
}
