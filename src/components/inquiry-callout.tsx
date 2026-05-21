import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";

type InquiryCalloutProps = {
  /** Small uppercase label above the headline. */
  eyebrow?: string;
  /** Serif headline. */
  headline?: string;
  /** Body line under the headline. */
  body?: string;
  /** Background variant — "dark" for ink sections, "light" for cream sections. */
  tone?: "dark" | "light";
};

/**
 * Reusable bottom-of-page CTA banner.
 * Drop one in just above `<SiteFooter />` on long content pages so visitors
 * always have a way back to the inquiry form without scrolling to the nav.
 */
export function InquiryCallout({
  eyebrow = "Have something coming up?",
  headline = "Let's talk about the shoot.",
  body = "Tell me the date, place, and what you want the photos to feel like. I'll come back with availability and the next step.",
  tone = "dark",
}: InquiryCalloutProps) {
  const isDark = tone === "dark";

  const sectionClass = isDark
    ? "bg-charcoal px-4 py-20 text-soft-white sm:px-6 lg:px-8 lg:py-24"
    : "bg-[#f3eee5] px-4 py-20 text-ink sm:px-6 lg:px-8 lg:py-24";
  const eyebrowClass = isDark
    ? "text-xs uppercase tracking-[0.22em] text-copper"
    : "text-xs uppercase tracking-[0.22em] text-[#8b6444]";
  const headlineClass = isDark
    ? "mt-4 max-w-3xl font-serif text-5xl leading-[0.96] text-soft-white sm:text-6xl"
    : "mt-4 max-w-3xl font-serif text-5xl leading-[0.96] text-ink sm:text-6xl";
  const bodyClass = isDark
    ? "mt-5 max-w-2xl text-base leading-7 text-soft-white/64"
    : "mt-5 max-w-2xl text-base leading-7 text-ink/68";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className={eyebrowClass}>{eyebrow}</p>
              <h2 className={headlineClass}>{headline}</h2>
              <p className={bodyClass}>{body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-self-end">
              <ButtonLink href="/contact" variant={isDark ? "primary" : "light"}>
                Start an inquiry
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                href="/investment"
                variant={isDark ? "secondary" : "ghost"}
                className={isDark ? "" : "border-ink/15 text-ink hover:bg-ink/6 hover:text-ink"}
              >
                See investment
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
