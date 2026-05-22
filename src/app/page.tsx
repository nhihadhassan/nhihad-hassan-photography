import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ServicesGrid } from "@/components/services-grid";
import { Testimonials } from "@/components/testimonials";
import { InquiryCallout } from "@/components/inquiry-callout";
import { brandConfig } from "@/lib/config";
import { featuredGalleries, portfolioItems } from "@/data/photography";
import { formatDisplayDate } from "@/lib/utils";

const heroImage =
  portfolioItems.find((item) => item.id === "rachel-autumn-leaves") ?? portfolioItems[0];
const sideImage = portfolioItems[5];
const featuredPortfolio = portfolioItems.filter((item) => item.featured).slice(0, 5);

const navItems: MobileNavItem[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/investment", label: "Investment" },
  { href: "/galleries/moove-ah", label: "Galleries" },
  { href: "/contact", label: "Contact" },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <main>
        {/* Hero — image-first splash */}
        <section className="relative min-h-[100dvh] overflow-hidden bg-ink">
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Soft top and bottom darkening so the photo carries the screen. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.5)_0%,rgba(8,8,8,0.08)_22%,rgba(8,8,8,0)_52%,rgba(8,8,8,0.62)_100%)]" />

          {/* Minimal centered header */}
          <header className="absolute inset-x-0 top-0 z-20 px-4 py-6 sm:px-8 sm:py-7">
            <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
              <nav className="col-start-1 hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-soft-white/80 md:flex">
                {navItems.slice(0, 2).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-soft-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <h1 className="col-start-2 justify-self-center whitespace-nowrap text-center font-serif uppercase text-soft-white text-lg tracking-[0.16em] sm:text-xl lg:text-2xl xl:text-[1.7rem]">
                {brandConfig.name}
              </h1>

              <div className="col-start-3 flex items-center justify-end gap-7">
                <nav className="hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-soft-white/80 md:flex">
                  {navItems.slice(2).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="transition hover:text-soft-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="md:hidden">
                  <MobileNav items={navItems} />
                </div>
              </div>
            </div>
          </header>

          {/* One quiet CTA */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-12 sm:pb-16">
            <Reveal>
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-3 border border-soft-white/45 px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-soft-white transition hover:border-soft-white hover:bg-soft-white/10"
              >
                View Portfolio
                <ArrowRight
                  className="size-3.5 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* Tagline strip */}
        <section className="bg-[#f3eee5] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Reveal>
            <p className="mx-auto max-w-4xl text-center font-serif text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              Toronto wedding, engagement and event photographer.
            </p>
          </Reveal>
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
                  I&rsquo;m a Toronto photographer working across weddings, cultural events, couples sessions, portraits, and nightlife. The approach holds wherever I point the camera: work with whatever the moment gives, then make pictures that hold.
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
