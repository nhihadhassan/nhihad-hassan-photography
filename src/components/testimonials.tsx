import { Quote } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { testimonials, type Testimonial } from "@/data/testimonials";

type TestimonialsProps = {
  /** Override the default eyebrow ("Words from clients"). */
  eyebrow?: string;
  /** Override the default headline. */
  headline?: string;
  /** Background variant — "dark" for ink sections, "light" for cream sections. */
  tone?: "dark" | "light";
};

/**
 * Public testimonials section. Returns `null` until the testimonials array
 * has at least one real entry — this is intentional so the site never
 * ships placeholder or empty-state social proof.
 */
export function Testimonials({
  eyebrow = "Words from clients",
  headline = "What people remember after the gallery arrives.",
  tone = "dark",
}: TestimonialsProps) {
  if (testimonials.length === 0) {
    return null;
  }

  const isDark = tone === "dark";
  const sectionClass = isDark
    ? "bg-charcoal px-4 py-20 text-soft-white sm:px-6 lg:px-8 lg:py-28"
    : "bg-[#f3eee5] px-4 py-20 text-ink sm:px-6 lg:px-8 lg:py-28";
  const eyebrowClass = isDark
    ? "text-xs uppercase tracking-[0.2em] text-copper"
    : "text-xs uppercase tracking-[0.2em] text-[#8b6444]";
  const headlineClass = isDark
    ? "mt-4 max-w-2xl font-serif text-5xl leading-[0.96] text-soft-white sm:text-6xl"
    : "mt-4 max-w-2xl font-serif text-5xl leading-[0.96] text-ink sm:text-6xl";
  const cardClass = isDark
    ? "flex h-full flex-col gap-5 rounded-[2px] border border-soft-white/10 bg-soft-white/4 p-7"
    : "flex h-full flex-col gap-5 rounded-[2px] border border-ink/10 bg-soft-white/70 p-7";
  const quoteIconClass = isDark ? "size-5 text-copper/80" : "size-5 text-[#8b6444]";
  const quoteTextClass = isDark
    ? "font-serif text-2xl leading-[1.25] text-soft-white"
    : "font-serif text-2xl leading-[1.25] text-ink";
  const metaPrimaryClass = isDark
    ? "text-sm font-medium text-soft-white"
    : "text-sm font-medium text-ink";
  const metaSecondaryClass = isDark
    ? "text-xs uppercase tracking-[0.18em] text-soft-white/60"
    : "text-xs uppercase tracking-[0.18em] text-ink/60";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-3xl">
            <p className={eyebrowClass}>{eyebrow}</p>
            <h2 className={headlineClass}>{headline}</h2>
          </div>
        </Reveal>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((entry, index) => (
            <Reveal key={entry.id} delay={index * 0.05}>
              <TestimonialCard
                entry={entry}
                cardClass={cardClass}
                quoteIconClass={quoteIconClass}
                quoteTextClass={quoteTextClass}
                metaPrimaryClass={metaPrimaryClass}
                metaSecondaryClass={metaSecondaryClass}
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TestimonialCard({
  entry,
  cardClass,
  quoteIconClass,
  quoteTextClass,
  metaPrimaryClass,
  metaSecondaryClass,
}: {
  entry: Testimonial;
  cardClass: string;
  quoteIconClass: string;
  quoteTextClass: string;
  metaPrimaryClass: string;
  metaSecondaryClass: string;
}) {
  const metaParts = [entry.shootType, entry.location, entry.date].filter(
    (part): part is string => Boolean(part),
  );

  return (
    <li className={cardClass}>
      <Quote className={quoteIconClass} aria-hidden="true" />
      <p className={quoteTextClass}>&ldquo;{entry.quote}&rdquo;</p>
      <div className="mt-auto">
        <p className={metaPrimaryClass}>{entry.name}</p>
        {metaParts.length > 0 ? (
          <p className={`${metaSecondaryClass} mt-1`}>{metaParts.join(" · ")}</p>
        ) : null}
      </div>
    </li>
  );
}
