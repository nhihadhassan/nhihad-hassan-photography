import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { QuestionnaireForm } from "@/components/questionnaire-form";
import { getQuestionnaireByToken } from "@/lib/questionnaires";
import { brandConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shoot questionnaire",
  robots: { index: false, follow: false },
};

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const q = await getQuestionnaireByToken(token);

  if (!q) {
    return (
      <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
        <main className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col justify-center px-5 py-16 sm:px-6">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
          <h1 className="mt-12 font-serif text-5xl leading-[0.95] sm:text-6xl">This questionnaire is unavailable.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/68">
            The link may have been replaced or removed. Please get in touch if you need a new one.
          </p>
          <div className="mt-8">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88">
              Contact Nhihad
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const first = q.client_name?.trim().split(/\s+/)[0];
  const questionnaireTitle = q.gallery_title
    ? `${q.gallery_title} questionnaire`
    : "Shoot questionnaire";

  return (
    <div className="min-h-[100dvh] bg-[#eeece8] text-ink">
      <main className="pb-24 sm:pb-32">
        <section className="relative min-h-[29rem] overflow-hidden bg-charcoal sm:min-h-[35rem]">
          <Image
            src="/portfolio/engagement-first-kiss.webp"
            alt="A couple sharing a quiet moment outdoors during their engagement session."
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_42%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.62)_0%,rgba(8,8,8,0.2)_45%,rgba(8,8,8,0.72)_100%)]" />

          <Link
            href="/"
            className="absolute left-5 top-6 z-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-soft-white/75 transition hover:text-soft-white sm:left-8 sm:top-8"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to site</span>
          </Link>

          <p className="absolute inset-x-20 top-6 z-10 text-center font-serif text-xl uppercase tracking-[0.04em] text-soft-white sm:top-7 sm:text-2xl">
            {brandConfig.name}
          </p>

          <div className="absolute inset-x-5 bottom-36 z-10 text-center text-soft-white sm:bottom-40">
            <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
              {first ? `Hi ${first},` : "Hello,"}
              <span className="mt-2 block font-normal">Please complete this questionnaire.</span>
            </h1>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-28 max-w-4xl px-4 sm:-mt-32 sm:px-6">
          <section className="bg-[#fbfaf7] px-6 py-8 shadow-[0_10px_32px_rgba(32,25,20,0.08)] sm:px-12 sm:py-11">
            <div className="flex flex-col gap-4 border-b border-ink/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="font-serif text-3xl leading-none sm:text-4xl">{questionnaireTitle}</h2>
              <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${q.submitted_at ? "bg-[#e5eee3] text-[#486342]" : "bg-[#eee7df] text-[#8b6444]"}`}>
                {q.submitted_at ? "Response received" : "Awaiting response"}
              </span>
            </div>

            <dl className="grid gap-5 py-7 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/45">From</dt>
                <dd className="mt-1.5 font-medium">{brandConfig.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/45">To</dt>
                <dd className="mt-1.5 font-medium">{q.client_name || "Our client"}</dd>
              </div>
            </dl>

            <p className="max-w-3xl text-[15px] leading-7 text-ink/70">
              A little detail helps me plan and make the most of our time together. Fill in whatever
              you can. Nothing here is required, and you can update your answers anytime before the shoot.
            </p>
          </section>

          <QuestionnaireForm token={token} responses={q.responses} submitted={Boolean(q.submitted_at)} />

          <p className="mt-12 text-center text-sm text-ink/55">
            Questions? Email{" "}
            <a href={`mailto:${brandConfig.publicContactEmail}`} className="font-medium text-ink underline underline-offset-4 decoration-ink/25 transition hover:decoration-ink">
              {brandConfig.publicContactEmail}
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
