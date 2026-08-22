import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { privatePageMetadata, withDefaultSocialImages } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(withDefaultSocialImages({
  title: "Custom package request received",
  description: "Your custom photography package request has been received.",
}));

export default function CustomPackageConfirmationPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <SiteHeader tone="light" />
      <main className="mx-auto grid min-h-[78dvh] max-w-3xl place-items-center px-4 pb-24 pt-36 text-center sm:px-6 sm:pt-40">
        <div>
          <CheckCircle2 className="mx-auto size-7 text-[#8b6444]" aria-hidden="true" />
          <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[#8b6444]">Request received</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.94] sm:text-7xl">Your custom request is in.</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-ink/62">
            I&apos;ll review your budget, coverage, photo count, and extra details, then reply personally with a tailored quote and availability.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/" className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-soft-white transition hover:bg-ink/88">
              Return home
            </Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center rounded-full border border-ink/14 px-6 text-sm font-medium text-ink transition hover:border-ink/30">
              View other packages
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
