import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  MailCheck,
  Send,
  Camera,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServicesGrid } from "@/components/services-grid";
import { Testimonials } from "@/components/testimonials";
import { InquiryCallout } from "@/components/inquiry-callout";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { services } from "@/data/services";
import { portfolioItems } from "@/data/photography";

export const metadata: Metadata = {
  title: "Investment",
  description:
    "Considered photography for weddings, couples, portraits, events, and nightlife in Toronto. Bookings are confirmed manually; deposits are sent via Interac e-Transfer.",
};

const heroImage = portfolioItems[0];

const imageById = new Map(portfolioItems.map((item) => [item.id, item] as const));

const bookingSteps = [
  {
    icon: Send,
    title: "Inquire",
    body: "Send the date, place, and what you want the day to feel like.",
  },
  {
    icon: MailCheck,
    title: "Booking confirmed",
    body: "If we're a good fit, you'll get a reply confirming the date and the deposit amount.",
  },
  {
    icon: CalendarCheck,
    title: "Deposit via Interac e-Transfer",
    body: "Deposit instructions are sent in that reply. Nothing is collected through this site.",
  },
  {
    icon: Camera,
    title: "Shoot day",
    body: "Coverage of the day at the pace it actually runs, with quiet direction where it helps.",
  },
  {
    icon: Sparkles,
    title: "Gallery delivery",
    body: "A private online gallery with favourites, downloads, and easy sharing for both families.",
  },
];

export default function InvestmentPage() {
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pb-20 pt-36 sm:pb-24 sm:pt-44 lg:pb-28 lg:pt-52">
          <Image
            src={heroImage.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.55)_0%,rgba(8,8,8,0.78)_55%,rgba(8,8,8,0.95)_100%)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.22em] text-copper">Investment</p>
                <h1 className="mt-5 font-serif text-6xl leading-[0.92] text-soft-white sm:text-7xl lg:text-[5.6rem]">
                  Considered photography, simply booked.
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-soft-white/72">
                  Wedding, couples, portrait, and event coverage in Toronto and across Ontario. Built around the feel of the day, delivered in a private gallery that&rsquo;s easy to share with everyone who matters.
                </p>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-soft-white/55">
                  Bookings are confirmed manually. Deposit instructions are sent after booking confirmation via <strong className="font-medium text-soft-white">Interac e-Transfer</strong> &mdash; there is no checkout on this site.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/contact">
                    Start an inquiry
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ButtonLink>
                  <ButtonLink href="/portfolio" variant="secondary">
                    View Portfolio
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How booking works */}
        <section className="bg-[#f3eee5] px-4 py-20 text-ink sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">How booking works</p>
                <h2 className="mt-4 font-serif text-5xl leading-[0.96] sm:text-6xl">
                  Five quiet steps from inquiry to gallery.
                </h2>
              </div>
            </Reveal>
            <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {bookingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.title} delay={index * 0.05}>
                    <li className="flex h-full flex-col gap-4 rounded-[2px] border border-ink/10 bg-soft-white/70 p-6">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 bg-soft-white text-[#8b6444]">
                          <Icon className="size-4" aria-hidden="true" strokeWidth={1.7} />
                        </span>
                        <span className="font-mono text-xs text-ink/55">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl leading-tight text-ink">{step.title}</h3>
                      <p className="text-sm leading-6 text-ink/68">{step.body}</p>
                    </li>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Services grid */}
        <ServicesGrid
          tone="dark"
          eyebrow="What I shoot"
          headline="Coverage for the five things I shoot most."
          intro="Each shoot type has its own pace, light, and rhythm. The approach stays the same: read the room, then make pictures that hold up away from the moment."
        />

        {/* Per-service blocks */}
        <section className="bg-charcoal px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-copper">Service detail</p>
                <h2 className="mt-4 font-serif text-5xl leading-[0.96] text-soft-white sm:text-6xl">
                  How each shoot is built.
                </h2>
              </div>
            </Reveal>
            <div className="mt-12 flex flex-col gap-12 lg:gap-16">
              {services.map((service, index) => {
                const image = imageById.get(service.imageId);
                const isReversed = index % 2 === 1;
                return (
                  <Reveal key={service.id} delay={0.03}>
                    <article
                      className={`grid gap-8 lg:items-center lg:gap-12 ${
                        isReversed ? "lg:grid-cols-[1.05fr_0.95fr]" : "lg:grid-cols-[0.95fr_1.05fr]"
                      }`}
                    >
                      {image ? (
                        <div
                          className={`relative aspect-[4/3] overflow-hidden rounded-[2px] bg-soft-white/8 ${
                            isReversed ? "lg:order-last" : ""
                          }`}
                        >
                          <Image
                            src={image.imageUrl}
                            alt={image.alt}
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-copper">{service.label}</p>
                        <h3 className="mt-3 font-serif text-4xl leading-[1] text-soft-white sm:text-5xl">
                          {service.shortBlurb}
                        </h3>
                        <p className="mt-5 max-w-xl text-base leading-7 text-soft-white/68">
                          {service.longBlurb}
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <ButtonLink href="/contact">
                            Inquire for {service.label.toLowerCase()}
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </ButtonLink>
                          <ButtonLink href={service.portfolioHref} variant="secondary">
                            See {service.label.toLowerCase()} portfolio
                          </ButtonLink>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <Testimonials
          tone="light"
          eyebrow="From recent clients"
          headline="What people remember once the gallery lands."
        />

        <InquiryCallout
          tone="dark"
          eyebrow="Ready when you are"
          headline="Tell me about the shoot."
          body="A short note with the date, place, and a sentence about the mood is enough. I'll come back with availability and the next step."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
