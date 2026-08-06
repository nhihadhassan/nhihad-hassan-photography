import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingScheduler } from "@/components/booking-scheduler";
import { fetchAvailability } from "@/lib/calendar";
import { findBookingSelection } from "@/lib/booking-options";
import { getPricing } from "@/lib/pricing";
import { services } from "@/data/services";
import { portfolioItems } from "@/data/photography";
import { withDefaultSocialImages } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withDefaultSocialImages({
  title: "Choose a date and time",
  description: "Request an available photography date and time in Toronto.",
});

type Props = {
  searchParams: Promise<{ service?: string; package?: string }>;
};

export default async function BookPage({ searchParams }: Props) {
  const query = await searchParams;
  const pricing = await getPricing();
  const selection = findBookingSelection(pricing, query.service ?? "", query.package ?? "");

  if (!selection) {
    return (
      <div className="min-h-[100dvh] bg-ink text-soft-white">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-40 text-center sm:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">Choose a session first</p>
          <h1 className="mt-5 font-serif text-6xl leading-none">Let&apos;s find the right package.</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-soft-white/62">
            Select a service and package, then you can choose an available date and time.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-copper/70 bg-copper px-5 text-sm font-medium text-ink transition hover:border-beige hover:bg-beige"
          >
            View services
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const availability = await fetchAvailability();
  const serviceImage = findServiceImage(selection.category.id);

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <SiteHeader tone="light" />
      <main className="pb-24 pt-28 sm:pt-32">
        <section className="relative isolate min-h-[360px] overflow-hidden bg-ink sm:min-h-[430px]">
          {serviceImage ? (
            <Image
              src={serviceImage.imageUrl}
              alt={serviceImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-65"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.88),rgba(8,8,8,0.42),rgba(8,8,8,0.68))]" />
          <div className="relative mx-auto flex min-h-[360px] max-w-7xl flex-col justify-end px-4 pb-12 pt-16 text-soft-white sm:min-h-[430px] sm:px-6 sm:pb-16 lg:px-8">
            <Link href="/contact" className="mb-auto inline-flex items-center gap-2 text-sm text-soft-white/68 transition hover:text-soft-white">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Change service
            </Link>
            <p className="text-xs uppercase tracking-[0.22em] text-copper">Step 1 of 2</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[0.94] sm:text-7xl">
              Choose a date and time.
            </h1>
          </div>
        </section>

        <div className="mx-auto -mt-1 max-w-5xl px-4 sm:px-6 lg:px-8">
          <section className="relative z-10 grid gap-5 border-b border-ink/10 bg-[#f8f3eb] px-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8b6444]">{selection.category.label}</p>
              <h2 className="mt-2 font-serif text-4xl">{selection.tier.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{selection.tier.details}</p>
            </div>
            <div className="grid gap-2 text-sm text-ink/68 sm:justify-items-end">
              <span className="font-serif text-3xl text-ink">{selection.tier.price}</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="size-4" />{selection.tier.duration}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="size-4" />Toronto / GTA</span>
            </div>
          </section>

          <BookingScheduler
            availability={availability ? Array.from(availability.entries()) : []}
            serviceId={selection.category.id}
            packageName={selection.tier.name}
            duration={selection.tier.duration}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
function findServiceImage(categoryId: string) {
  const serviceId = categoryId === "engagements" ? "couples" : categoryId;
  const service = services.find((item) => item.id === serviceId);
  return portfolioItems.find((item) => item.id === service?.imageId) ?? null;
}
