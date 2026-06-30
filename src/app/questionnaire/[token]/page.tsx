import type { Metadata } from "next";
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

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-14 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>

        <p className="mt-12 text-xs uppercase tracking-[0.22em] text-[#8b6444]">Shoot questionnaire</p>
        <h1 className="mt-3 font-serif text-4xl leading-[1.02] sm:text-5xl">
          {first ? `A few questions, ${first}.` : "A few questions before your shoot."}
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink/65">
          A little detail helps me plan and make the most of our time together. Fill in whatever you
          can; nothing here is required, and you can update it anytime before the shoot.
        </p>

        <QuestionnaireForm token={token} responses={q.responses} submitted={Boolean(q.submitted_at)} />

        <p className="mt-10 text-sm text-ink/55">
          Questions? Email{" "}
          <a href={`mailto:${brandConfig.contactEmail}`} className="font-medium text-ink underline-offset-4 hover:underline">
            {brandConfig.contactEmail}
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
