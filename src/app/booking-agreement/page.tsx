import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { PrintButton } from "@/components/print-button";
import { brandConfig } from "@/lib/config";
import {
  agreementDetailFields,
  agreementDisclaimer,
  agreementIntro,
  agreementSections,
} from "@/data/booking-agreement";

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

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink print:bg-white">
      <div className="print:hidden">
        <SiteHeader tone="light" />
      </div>

      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8 print:pt-8">
        <article className="mx-auto max-w-3xl">
          {/* Header */}
          <Reveal>
            <p className="text-xs uppercase tracking-[0.18em] text-ink/55">
              {brandConfig.name}
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-[0.95] sm:text-6xl">
              Booking Agreement
            </h1>
            <p className="mt-6 text-base leading-7 text-ink/70">{agreementIntro}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
              <PrintButton />
            </div>

            <p className="mt-6 rounded-md border border-ink/15 bg-white/50 px-4 py-3 text-sm leading-6 text-ink/65">
              {agreementDisclaimer}
            </p>
          </Reveal>

          {/* Agreement details (fill-in / query-prefilled) */}
          <Reveal delay={0.05}>
            <section className="mt-12">
              <h2 className="font-serif text-2xl text-ink">Agreement details</h2>
              <dl className="mt-4 divide-y divide-ink/12 border-y border-ink/12">
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]">
                  <dt className="text-sm font-medium text-ink/60">Photographer</dt>
                  <dd className="text-sm text-ink/85">
                    {brandConfig.name}, {brandConfig.contactEmail}, Toronto, Ontario
                  </dd>
                </div>
                {agreementDetailFields.map((field) => {
                  const raw = first(params[field.param]).trim();
                  const value =
                    raw && MONEY_FIELDS.has(field.param) && !raw.startsWith("$")
                      ? `$${raw}`
                      : raw;
                  return (
                    <div
                      key={field.param}
                      className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr]"
                    >
                      <dt className="text-sm font-medium text-ink/60">{field.label}</dt>
                      <dd className="text-sm text-ink/85">
                        {value ? (
                          value
                        ) : (
                          <span className="mt-3 block h-5 max-w-xs border-b border-dashed border-ink/30" />
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          </Reveal>

          {/* Clause sections */}
          <Reveal delay={0.05}>
            <div className="mt-12 space-y-9">
              {agreementSections.map((section) => (
                <section key={section.heading} className="break-inside-avoid">
                  <h2 className="font-serif text-2xl text-ink">{section.heading}</h2>
                  <div className="mt-3 space-y-3">
                    {section.clauses.map((clause, i) => (
                      <p key={i} className="text-sm leading-7 text-ink/75">
                        {clause}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Reveal>

          {/* Signatures */}
          <Reveal delay={0.05}>
            <section className="mt-14 break-inside-avoid">
              <h2 className="font-serif text-2xl text-ink">Signatures</h2>
              <p className="mt-3 text-sm leading-7 text-ink/75">
                By signing below, both parties agree to the terms set out in this agreement.
              </p>
              <div className="mt-8 grid gap-10 sm:grid-cols-2">
                {["Client", "Photographer"].map((role) => (
                  <div key={role}>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{role}</p>
                    <div className="mt-8 border-t border-ink/40" />
                    <p className="mt-1 text-xs text-ink/55">Name</p>
                    <div className="mt-8 border-t border-ink/40" />
                    <p className="mt-1 text-xs text-ink/55">Signature</p>
                    <div className="mt-8 border-t border-ink/40" />
                    <p className="mt-1 text-xs text-ink/55">Date</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        </article>
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
