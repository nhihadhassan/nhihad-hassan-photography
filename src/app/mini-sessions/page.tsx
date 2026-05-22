import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { InquiryCallout } from "@/components/inquiry-callout";
import { miniSessionOfferings, miniSessionFaqs } from "@/data/mini-sessions";
import { portfolioItems } from "@/data/photography";
import { brandConfig } from "@/lib/config";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sessions",
  description: `Portrait, couples, and event photography sessions in Toronto. Inquire to book with ${brandConfig.name}.`,
  openGraph: {
    title: `Sessions | ${brandConfig.name}`,
    description: "Portrait, couples, and event sessions in Toronto. No dollar figures, book by inquiry.",
  },
};

export default function MiniSessionsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-soft-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-soft-white/10 px-5 pb-20 pt-32 text-center sm:pb-28 sm:pt-40 lg:px-8">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">Sessions</p>
            <h1 className="mt-4 font-serif text-5xl font-medium leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Photographs worth keeping.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-soft-white/62">
              Couples, portraits, events. Shot with intention across Toronto. Every session
              is focused, personal, and booked by inquiry.
            </p>
            <p className="mt-3 text-sm text-soft-white/50">
              No checkout on this site. Deposit via{" "}
              <strong className="font-medium text-soft-white/75">Interac e-Transfer</strong> after booking confirmation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/contact" variant="primary">
                Start an inquiry
              </ButtonLink>
              <ButtonLink href="/portfolio" variant="secondary">
                See the portfolio
              </ButtonLink>
            </div>
          </Reveal>
        </section>

        {/* Sessions grid */}
        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                What I shoot
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {miniSessionOfferings.map((offering, i) => {
                // Pick a representative portfolio image for this category
                const samplePhoto = portfolioItems.find(
                  (p) => p.category === offering.portfolioCategory,
                );

                return (
                  <Reveal key={offering.id} delay={i * 0.1}>
                    <article className="group overflow-hidden rounded-md border border-soft-white/10 bg-soft-white/5">
                      {/* Cover image */}
                      {samplePhoto ? (
                        <div className="relative aspect-[4/3] overflow-hidden bg-soft-white/10">
                          <Image
                            src={samplePhoto.imageUrl}
                            alt={samplePhoto.alt}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-[1.04]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : null}

                      <div className="p-6">
                        <p className="text-xs font-medium uppercase tracking-widest text-copper">
                          Session
                        </p>
                        <h3 className="mt-2 font-serif text-2xl font-medium">
                          {offering.title}
                        </h3>
                        <p className="mt-1 text-sm text-soft-white/55">{offering.tagline}</p>
                        <p className="mt-4 text-sm leading-relaxed text-soft-white/72">
                          {offering.description}
                        </p>

                        {/* What's included */}
                        <ul className="mt-5 space-y-1.5">
                          {offering.includes.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-soft-white/70">
                              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-copper" aria-hidden="true" />
                              {item}
                            </li>
                          ))}
                        </ul>

                        <p className="mt-5 text-xs text-soft-white/60">
                          <strong className="font-medium text-soft-white/70">Availability:</strong>{" "}
                          {offering.availability}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <ButtonLink
                            href="/contact"
                            variant="primary"
                            className="rounded-md text-sm"
                          >
                            Inquire to book
                          </ButtonLink>
                          <Link
                            href={`/portfolio/${offering.portfolioCategory}`}
                            className="text-sm text-soft-white/60 underline-offset-2 hover:text-soft-white hover:underline"
                          >
                            See portfolio →
                          </Link>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-soft-white/10 bg-charcoal px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                Common questions
              </h2>
            </Reveal>

            <dl className="mt-10 divide-y divide-soft-white/10">
              {miniSessionFaqs.map((faq, i) => (
                <Reveal key={faq.q} delay={i * 0.06}>
                  <div className="py-6">
                    <dt className="text-base font-medium">{faq.q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-soft-white/70">{faq.a}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <InquiryCallout />
      </main>

      <SiteFooter />
    </div>
  );
}
