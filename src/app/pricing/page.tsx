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
    "Photography pricing for weddings, couples, events, portraits, and nightlife in Toronto. Introductory rates, booked by inquiry, deposit by Interac e-Transfer.",
  openGraph: {
    title: `Pricing | ${brandConfig.name}`,
    description:
      "Wedding, couples, event, portrait, and nightlife photography rates for Toronto and Ontario.",
  },
};

const bookingSteps = [
  "Send an inquiry with your date, location, and the kind of shoot you have in mind.",
  "I confirm availability and we settle the collection and any details over email.",
  "A deposit by Interac e-Transfer holds the date. There is no checkout on this site.",
  "We shoot, and your edited gallery arrives as a private online gallery to share.",
];

export default function PricingPage() {
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />

      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-copper">Pricing</p>
            <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[0.92] text-soft-white sm:text-7xl">
              Clear rates, honestly set.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-soft-white/62">
              These are introductory rates while I build the portfolio in each
              area. You get a photographer working hard to over-deliver. Every
              shoot is booked by inquiry, so reach out and we will sort the
              details together.
            </p>
          </Reveal>
        </section>

        {/* Pricing sections */}
        <div className="mx-auto mt-16 max-w-7xl space-y-20 lg:mt-20 lg:space-y-24">
          {pricingCategories.map((category) => (
            <section key={category.id}>
              <Reveal>
                <div className="grid gap-6 border-b border-soft-white/10 pb-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                  <div>
                    <h2 className="font-serif text-4xl text-soft-white sm:text-5xl">
                      {category.label}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-soft-white/62">
                      {category.blurb}
                    </p>
                  </div>
                  {category.note ? (
                    <p className="max-w-xl text-sm leading-6 text-soft-white/52 lg:justify-self-end lg:text-right">
                      {category.note}
                    </p>
                  ) : null}
                </div>
              </Reveal>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.tiers.map((tier, index) => (
                  <Reveal key={tier.name} delay={index * 0.05}>
                    <div className="flex h-full flex-col rounded-[2px] border border-soft-white/10 bg-soft-white/[0.03] p-6 sm:p-7">
                      <p className="text-xs uppercase tracking-[0.18em] text-soft-white/55">
                        {tier.name}
                      </p>
                      <p className="mt-3 font-serif text-4xl text-soft-white">
                        {tier.price}
                      </p>
                      <p className="mt-1 text-sm text-copper">{tier.duration}</p>
                      <ul className="mt-5 space-y-2.5 border-t border-soft-white/10 pt-5">
                        {tier.includes.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-sm leading-6 text-soft-white/72"
                          >
                            <Check
                              className="mt-0.5 size-3.5 shrink-0 text-copper"
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

              <Reveal>
                <div className="mt-6">
                  <ButtonLink href="/contact" variant="secondary">
                    Inquire for {category.label.toLowerCase()}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ButtonLink>
                </div>
              </Reveal>
            </section>
          ))}
        </div>

        {/* How booking works */}
        <section className="mx-auto mt-20 max-w-7xl lg:mt-24">
          <Reveal>
            <div className="rounded-[2px] border border-soft-white/10 bg-charcoal p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-copper">
                How booking works
              </p>
              <h2 className="mt-4 max-w-xl font-serif text-3xl text-soft-white sm:text-4xl">
                Booked by inquiry, confirmed by deposit.
              </h2>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {bookingSteps.map((step, index) => (
                  <li key={step} className="flex flex-col gap-3">
                    <span className="font-serif text-2xl text-copper">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-6 text-soft-white/68">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-sm leading-6 text-soft-white/52">
                Prices are quoted in Canadian dollars and cover the shoot,
                editing, and gallery delivery. Travel beyond the Greater Toronto
                Area may add a small fee, confirmed before you book.
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <InquiryCallout tone="dark" />
      <SiteFooter />
    </div>
  );
}
