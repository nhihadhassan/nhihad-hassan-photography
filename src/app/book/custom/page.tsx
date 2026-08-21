import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Clock3, WalletCards } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CustomPackageForm } from "@/components/custom-package-form";
import { portfolioItems } from "@/data/photography";
import { withDefaultSocialImages } from "@/lib/seo";

export const metadata: Metadata = withDefaultSocialImages({
  title: "Request a custom package",
  description: "Request tailored photography coverage based on your budget, timing, and desired image count.",
}, "/book/custom");

export default function CustomPackagePage() {
  const image = portfolioItems.find((item) => item.id === "choyons-grad-couple");

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <SiteHeader tone="light" />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 sm:pt-40 lg:px-8">
        <Link href="/contact" className="inline-flex items-center gap-2 text-sm text-ink/58 transition hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to packages
        </Link>

        <div className="mt-8 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8b6444]">Custom package</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.94] sm:text-7xl">Tell me what the day needs.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/62">
            Share the scope you have in mind. I&apos;ll shape a package around the coverage, finished images, and budget that make sense for it.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <CustomPackageForm />
          <aside className="overflow-hidden bg-ink text-soft-white lg:sticky lg:top-28">
            {image ? (
              <div className="relative aspect-[16/9]">
                <Image src={image.imageUrl} alt={image.alt} fill sizes="(min-width: 1024px) 36vw, 100vw" className="object-cover" />
              </div>
            ) : null}
            <div className="p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-copper">Built around the brief</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">A quote that fits the work.</h2>
              <ul className="mt-8 grid gap-5 text-sm text-soft-white/68">
                <Summary icon={WalletCards} title="Your budget" body="A clear range helps me shape the strongest realistic option." />
                <Summary icon={Camera} title="Your deliverables" body="Tell me how many finished photographs you want to walk away with." />
                <Summary icon={Clock3} title="Your coverage" body="Choose the time window that matches the pace of the day." />
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Summary({ icon: Icon, title, body }: { icon: typeof Camera; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-copper" aria-hidden="true" />
      <div>
        <p className="font-medium text-soft-white">{title}</p>
        <p className="mt-1 leading-6">{body}</p>
      </div>
    </li>
  );
}
