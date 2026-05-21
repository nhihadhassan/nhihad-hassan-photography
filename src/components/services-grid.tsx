import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { services, type Service } from "@/data/services";
import { portfolioItems } from "@/data/photography";

type ServicesGridProps = {
  /** Shown as the small uppercase label above the section headline. */
  eyebrow?: string;
  /** Main serif headline. */
  headline?: string;
  /** Optional supporting paragraph beside the headline. */
  intro?: string;
  /** Background variant — "dark" for ink sections, "light" for cream sections. */
  tone?: "dark" | "light";
};

const imageById = new Map(portfolioItems.map((item) => [item.id, item] as const));

/**
 * Five-card services grid used on the homepage and /investment page.
 * Cards link out to the closest existing portfolio category.
 */
export function ServicesGrid({
  eyebrow = "What I shoot",
  headline = "Built for weddings, couples, portraits, events, and nightlife.",
  intro = "Five shoot types, one approach: read the room first, then make pictures that hold up away from the moment.",
  tone = "dark",
}: ServicesGridProps) {
  const isDark = tone === "dark";

  const sectionClass = isDark
    ? "bg-ink px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    : "bg-[#f3eee5] px-4 py-20 text-ink sm:px-6 lg:px-8 lg:py-28";
  const eyebrowClass = isDark
    ? "text-xs uppercase tracking-[0.2em] text-copper"
    : "text-xs uppercase tracking-[0.2em] text-[#8b6444]";
  const headlineClass = isDark
    ? "mt-4 max-w-xl font-serif text-5xl leading-[0.96] text-soft-white sm:text-6xl"
    : "mt-4 max-w-xl font-serif text-5xl leading-[0.96] text-ink sm:text-6xl";
  const introClass = isDark
    ? "max-w-2xl text-base leading-7 text-soft-white/62 lg:justify-self-end"
    : "max-w-2xl text-base leading-7 text-ink/68 lg:justify-self-end";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className={eyebrowClass}>{eyebrow}</p>
              <h2 className={headlineClass}>{headline}</h2>
            </div>
            {intro ? <p className={introClass}>{intro}</p> : null}
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-4 md:grid-cols-2 md:auto-rows-[300px] lg:grid-cols-3 lg:auto-rows-[360px]">
          {services.map((service, index) => (
            <Reveal
              key={service.id}
              delay={index * 0.05}
              className={index === 0 ? "md:col-span-2 md:row-span-1 lg:row-span-2" : ""}
            >
              <ServiceCard service={service} tone={tone} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceCard({ service, tone }: { service: Service; tone: "dark" | "light" }) {
  const image = imageById.get(service.imageId);

  return (
    <Link
      href={service.portfolioHref}
      className="group relative block h-full min-h-72 overflow-hidden rounded-[2px] bg-soft-white/8"
    >
      {image ? (
        <Image
          src={image.imageUrl}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
        />
      ) : null}
      <div
        className={
          tone === "dark"
            ? "absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/25 to-ink/10"
            : "absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/15 to-transparent"
        }
      />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-beige/80">Service</p>
        <h3 className="mt-2 font-serif text-3xl leading-none text-soft-white sm:text-4xl">
          {service.label}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-soft-white/82">{service.shortBlurb}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-copper transition group-hover:text-soft-white">
          See portfolio
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
