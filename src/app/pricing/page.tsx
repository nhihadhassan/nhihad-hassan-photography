import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { InquiryCallout } from "@/components/inquiry-callout";
import { pricingCategories } from "@/data/pricing";
import { brandConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Photography rates for weddings, couples, events, portraits, and nightlife in Toronto. Booked by inquiry, deposit by Interac e-Transfer.",
  openGraph: {
    title: `Pricing | ${brandConfig.name}`,
    description:
      "Wedding, couples, event, portrait, and nightlife photography rates for Toronto and Ontario.",
  },
};

const bookingSteps = [
  "Send your date, location, and the kind of shoot.",
  "I reply with availability and the deposit amount.",
  "An Interac e-Transfer holds the date. No checkout here.",
  "We shoot, and your gallery arrives online to share.",
];

export default function PricingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <SiteHeader tone="light" />

      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">Pricing</p>
            <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[0.92] sm:text-7xl">
              Clear rates, honestly set.
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
          </Reveal>
        </section>

        {/* Pricing sections */}
        <div className="mx-auto mt-16 max-w-7xl space-y-16 lg:mt-20 lg:space-y-20">
          {pricingCategories.map((category) => (
            <section key={category.id}>
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
                    <p className="max-w-xl text-sm leading-6 text-ink/52 lg:justify-self-end lg:text-right">
                      {category.note}
                    </p>
                  ) : null}
                </div>
              </Reveal>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.tiers.map((tier, index) => (
                  <Reveal key={tier.name} delay={index * 0.05}>
                    <div className="flex h-full flex-col rounded-[2px] border border-ink/12 bg-soft-white/70 p-6 sm:p-7">
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/50">
                        {tier.name}
                      </p>
                      <p className="mt-3 font-serif text-4xl">{tier.price}</p>
                      <p className="mt-1 text-sm text-[#8b6444]">{tier.duration}</p>
                      <ul className="mt-5 space-y-2.5 border-t border-ink/12 pt-5">
                        {tier.includes.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-sm leading-6 text-ink/72"
                          >
                            <Check
                              className="mt-0.5 size-3.5 shrink-0 text-[#8b6444]"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* How booking works */}
        <section className="mx-auto mt-16 max-w-7xl lg:mt-20">
          <Reveal>
            <div className="rounded-[2px] border border-ink/12 bg-soft-white/60 p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">
                How booking works
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-3xl sm:text-4xl">
                Booked by inquiry, confirmed by deposit.
              </h2>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {bookingSteps.map((step, index) => (
                  <li key={step} className="flex flex-col gap-2.5">
                    <span className="font-serif text-2xl text-[#8b6444]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-6 text-ink/68">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-sm leading-6 text-ink/52">
                Prices are in Canadian dollars and cover the shoot, editing, and
                gallery delivery. Travel beyond the Greater Toronto Area may add
                a small fee, confirmed before you book.
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <InquiryCallout tone="light" />
      <SiteFooter />
    </div>
  );
}
