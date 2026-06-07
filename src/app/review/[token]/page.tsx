import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { getReviewRequestByToken } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leave a review",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReviewRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getReviewRequestByToken(token);

  if (!request) {
    return (
      <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
        <main className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col justify-center px-4 py-16 sm:px-6">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
          <p className="mt-12 text-xs uppercase tracking-[0.22em] text-[#8b6444]">Review request</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-ink sm:text-6xl">
            This review link is unavailable.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/68">
            The request may have expired, been replaced, or been turned off. You can still get in
            touch directly if you need anything from your gallery.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
            >
              Contact Nhihad
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const clientLabel = request.client_name ? `, ${request.client_name}` : "";

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>

        <section className="grid min-h-[70dvh] gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b6444]">Google review request</p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
              Thank you{clientLabel} for trusting me with your photos.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-ink/68">
              If you have a minute, a public Google review helps future clients understand what it
              is like to work with Nhihad Hassan Photography. Please write only what reflects your
              genuine experience, in your own words.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/55">
              There is no incentive for leaving a review, and this request is not asking for a
              specific rating or specific wording.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {request.googleReviewUrl ? (
                <a
                  href={`/review/${token}/google`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
                >
                  Leave a Google review
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full border border-ink/18 px-6 py-3 text-sm font-medium text-ink/55">
                  Google review link not configured yet
                </span>
              )}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-ink/18 px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/35"
              >
                Contact me instead
              </Link>
            </div>
          </div>

          <aside className="border-y border-ink/12 py-8 lg:border-l lg:border-y-0 lg:py-10 lg:pl-10">
            <div className="flex gap-1 text-[#8b6444]" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-5 fill-current" />
              ))}
            </div>
            <h2 className="mt-6 font-serif text-3xl leading-tight text-ink">
              A few useful prompts, if they help.
            </h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-ink/65">
              <li>What kind of session or event did we photograph?</li>
              <li>How did the experience feel before, during, or after the shoot?</li>
              <li>Was there anything about the final gallery or delivery that stood out?</li>
            </ul>
            <p className="mt-7 text-xs uppercase tracking-[0.18em] text-ink/45">
              Reviews shown on the site are genuine Google reviews, added by hand with their
              original date.
            </p>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
