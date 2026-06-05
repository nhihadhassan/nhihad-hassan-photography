import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { InquiryCallout } from "@/components/inquiry-callout";
import { PricingTierCard } from "@/components/pricing-tier-card";
import { HowBookingWorks } from "@/components/how-booking-works";
import { pricingCategories } from "@/data/pricing";
import { brandConfig } from "@/lib/config";
import { withDefaultSocialImages } from "@/lib/seo";

export const metadata: Metadata = withDefaultSocialImages({
  title: "Pricing",
  description:
    "Photography rates for weddings, couples, events, portraits, and nightlife in Toronto. Booked by inquiry, deposit by Interac e-Transfer.",
  openGraph: {
    title: `Pricing | ${brandConfig.name}`,
    description:
      "Wedding, couples, event, portrait, and nightlife photography rates for Toronto and Ontario.",
  },
});

export default function PricingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <SiteHeader tone="light" />

      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <h1 className="max-w-3xl font-serif text-6xl leading-[0.92] sm:text-7xl">
              Pricing
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink/64">
              Introductory rates while I build the portfolio. Every shoot is
              booked by inquiry.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact">
                Start an inquiry
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/portfolio" variant="light">
                View portfolio
              </ButtonLink>
            </div>

            {/* All services — jump links to each pricing section */}
            <div className="mt-10 border-t border-ink/12 pt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/62">
                What I shoot
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {pricingCategories.map((category) => (
                  <a
                    key={category.id}
                    href={`#${category.id}`}
                    className="rounded-full border border-ink/15 bg-soft-white/50 px-4 py-2 text-xs uppercase tracking-[0.13em] text-ink/72 transition hover:border-ink/40 hover:text-ink"
                  >
                    {category.label}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Pricing sections */}
        <div className="mx-auto mt-16 max-w-7xl space-y-16 lg:mt-20 lg:space-y-20">
          {pricingCategories.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-28">
              <Reveal>
                <div className="grid gap-4 border-b border-ink/12 pb-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                  <div>
                    <h2 className="font-serif text-4xl sm:text-5xl">
                      {category.label}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-ink/62">
                      {category.blurb}
                    </p>
                  </div>
                  {category.note ? (
                    <p className="max-w-xl text-sm leading-6 text-ink/62 lg:justify-self-end lg:text-right">
                      {category.note}
                    </p>
                  ) : null}
                </div>
              </Reveal>

              <div className="mt-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.tiers.map((tier, index) => (
                  <Reveal key={tier.name} delay={index * 0.05}>
                    <PricingTierCard tier={tier} />
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* How booking works */}
        <HowBookingWorks className="mt-16 lg:mt-20" />
      </main>

      <InquiryCallout tone="light" />
      <SiteFooter />
    </div>
  );
}
