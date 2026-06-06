import { ExternalLink, Quote, Star } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { getApprovedClientReviews, type ClientReview } from "@/lib/reviews";
import { formatCompactDate } from "@/lib/utils";

type TestimonialsProps = {
  /** Override the default eyebrow ("Words from clients"). */
  eyebrow?: string;
  /** Override the default headline. */
  headline?: string;
  /** Background variant: "dark" for ink sections, "light" for cream sections. */
  tone?: "dark" | "light";
};

/**
 * Public testimonials section. Returns `null` until at least one approved
 * Google review exists, so the site never ships placeholder social proof.
 */
export async function Testimonials({
  eyebrow = "Words from clients",
  headline = "What people remember after the gallery arrives.",
  tone = "dark",
}: TestimonialsProps) {
  const reviews = await getApprovedClientReviews(6);

  if (reviews.length === 0) {
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
          {reviews.map((entry, index) => (
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
  entry: ClientReview;
  cardClass: string;
  quoteIconClass: string;
  quoteTextClass: string;
  metaPrimaryClass: string;
  metaSecondaryClass: string;
}) {
  const sourceText = `Google review · ${formatCompactDate(entry.review_date)}`;

  return (
    <li className={cardClass}>
      <div className="flex items-center justify-between gap-4">
        <Quote className={quoteIconClass} aria-hidden="true" />
        <div className="flex gap-0.5 text-copper" aria-label={`${entry.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`size-4 ${index < entry.rating ? "fill-current" : "opacity-30"}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <p className={quoteTextClass}>&ldquo;{entry.review_text}&rdquo;</p>
      <div className="mt-auto">
        <p className={metaPrimaryClass}>{entry.reviewer_name}</p>
        <p className={`${metaSecondaryClass} mt-1`}>{sourceText}</p>
        {entry.source_url ? (
          <a
            href={entry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${metaSecondaryClass} mt-3 inline-flex items-center gap-1.5 transition hover:text-copper`}
          >
            Read more on Google
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </li>
  );
}
