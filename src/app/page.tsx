import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ServicesGrid } from "@/components/services-grid";
import { Testimonials } from "@/components/testimonials";
import { InquiryCallout } from "@/components/inquiry-callout";
import { brandConfig } from "@/lib/config";
import { featuredGalleries, portfolioItems } from "@/data/photography";
import { formatDisplayDate } from "@/lib/utils";

const heroImage = portfolioItems[0];
const sideImage = portfolioItems[5];
const featuredPortfolio = portfolioItems.filter((item) => item.featured).slice(0, 5);

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main>
        <section className="relative min-h-[100dvh] overflow-hidden">
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.86),rgba(8,8,8,0.45)_42%,rgba(8,8,8,0.78)),linear-gradient(180deg,rgba(8,8,8,0.08),rgba(8,8,8,0.9))]" />
          <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl items-end px-4 pb-10 pt-32 sm:px-6 lg:px-8 lg:pb-16">
            <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <Reveal>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-beige/75">
                    Toronto wedding, couples, event, and nightlife photography
                  </p>
                  <h1 className="mt-5 max-w-5xl font-serif text-6xl font-medium leading-[0.88] tracking-tight text-soft-white sm:text-8xl lg:text-[9.2rem]">
                    {brandConfig.name}
                  </h1>
                  <p className="mt-7 max-w-2xl text-lg leading-8 text-soft-white/70 sm:text-xl">
                    Wedding, couples, portrait, and event photography based in Toronto — shaped around atmosphere, movement, and the moments worth keeping.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/portfolio">
                      View Portfolio
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </ButtonLink>
                    <ButtonLink href="/contact" variant="secondary">
                      Book / Inquire
                    </ButtonLink>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.12}>
                <div className="border-t border-soft-white/16 pt-6 lg:border-l lg:border-t-0 lg:pl-7">
                  <p className="text-sm leading-6 text-soft-white/64">
                    Photography for first looks, packed dance floors, family rituals, soft portraits, and the late-night frames that still feel loud the next morning.
                  </p>
                  <dl className="mt-7 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-soft-white/42">Base</dt>
                      <dd className="mt-1 text-soft-white">Toronto</dd>
                    </div>
                    <div>
                      <dt className="text-soft-white/42">Focus</dt>
                      <dd className="mt-1 text-soft-white">Weddings &amp; events</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-ink px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-copper">Selected work</p>
                  <h2 className="mt-4 max-w-xl font-serif text-5xl leading-[0.95] text-soft-white sm:text-6xl">
                    Built around the photograph first.
                  </h2>
                </div>
                <p className="max-w-2xl text-base leading-7 text-soft-white/62 lg:justify-self-end">
                  Recent frames pulled from real shoots around Toronto and Ontario, across every kind of work I take on.
                </p>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3 md:auto-rows-[260px] lg:auto-rows-[330px]">
              {featuredPortfolio.map((item, index) => (
                <Reveal
                  key={item.id}
                  delay={index * 0.04}
                  className={index === 0 ? "md:col-span-2 md:row-span-2" : ""}
                >
                  <Link
                    href={`/portfolio/${item.category}`}
                    className="group relative block h-full min-h-72 overflow-hidden rounded-[2px] bg-soft-white/8"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.alt}
                      fill
                      sizes={index === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-beige/75">{item.location}</p>
                      <h3 className="mt-2 font-serif text-3xl leading-none text-soft-white">{item.title}</h3>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <ServicesGrid tone="light" />

        <section className="bg-charcoal px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1fr]">
            <Reveal>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-copper">Client galleries</p>
                <h2 className="mt-4 font-serif text-5xl leading-[0.96] text-soft-white sm:text-6xl">
                  Your photos, delivered in a gallery worth opening.
                </h2>
              </div>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {featuredGalleries.map((gallery, index) => (
                <Reveal key={gallery.slug} delay={index * 0.06}>
                  <Link
                    href={`/galleries/${gallery.slug}`}
                    className="group block overflow-hidden rounded-[2px] border border-soft-white/10 bg-soft-white/5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-soft-white/8">
                      <Image
                        src={gallery.imageUrl}
                        alt={gallery.alt}
                        fill
                        sizes="(min-width: 768px) 40vw, 100vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.035]"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-xs text-soft-white/52">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          {formatDisplayDate(gallery.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {gallery.location}
                        </span>
                      </div>
                      <h3 className="mt-4 font-serif text-3xl text-soft-white">{gallery.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-soft-white/58">{gallery.description}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Testimonials tone="dark" />

        <section className="bg-ink px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="relative aspect-[5/6] overflow-hidden rounded-[2px] bg-soft-white/8">
                <Image
                  src={sideImage.imageUrl}
                  alt={sideImage.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-copper">About</p>
                <h2 className="mt-4 max-w-2xl font-serif text-5xl leading-[0.96] text-soft-white sm:text-6xl">
                  Photographs that keep the atmosphere intact.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-7 text-soft-white/62">
                  I&rsquo;m a Toronto photographer working across weddings, cultural events, couples sessions, portraits, and nightlife. The approach holds wherever I point the camera: read the room first, then make pictures that still mean something a year later.
                </p>
                <div className="mt-8">
                  <ButtonLink href="/contact">
                    Start an inquiry
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <InquiryCallout tone="dark" />
      </main>
      <SiteFooter />
    </div>
  );
}
