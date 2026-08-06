import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingDetailsForm } from "@/components/booking-details-form";
import { findBookingSelection, startingPrice } from "@/lib/booking-options";
import { getBookingVisual } from "@/lib/booking-visuals";
import { getPricing } from "@/lib/pricing";
import { withDefaultSocialImages } from "@/lib/seo";

export const metadata: Metadata = withDefaultSocialImages({
  title: "Complete your inquiry",
  description: "Share your contact information to request a photography session.",
});

type Props = {
  searchParams: Promise<{ service?: string; package?: string; date?: string; time?: string }>;
};

export default async function BookingDetailsPage({ searchParams }: Props) {
  const query = await searchParams;
  const pricing = await getPricing();
  const selection = findBookingSelection(pricing, query.service ?? "", query.package ?? "");
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "");
  const validTime = Boolean(query.time?.trim());

  if (!selection || !validDate || !validTime) {
    return (
      <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
        <SiteHeader tone="light" />
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-40 text-center sm:px-6">
          <h1 className="font-serif text-6xl leading-none">Choose a date and time first.</h1>
          <Link href="/contact" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-soft-white">Start booking</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const date = query.date!;
  const time = query.time!;
  const image = await getBookingVisual(selection.category.id);
  const basePrice = startingPrice(selection.tier.price);
  const deposit = basePrice ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(basePrice * 0.25) : null;

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <SiteHeader tone="light" />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 sm:pt-40 lg:px-8">
        <Link
          href={`/book?service=${encodeURIComponent(selection.category.id)}&package=${encodeURIComponent(selection.tier.name)}`}
          className="inline-flex items-center gap-2 text-sm text-ink/58 transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Change date or time
        </Link>
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8b6444]">Step 2 of 3</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.94] sm:text-7xl">Complete your inquiry.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink/62">Please enter your contact information to proceed.</p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <BookingDetailsForm
            serviceId={selection.category.id}
            packageName={selection.tier.name}
            eventDate={date}
            eventTime={time}
          />
          <aside className="overflow-hidden bg-ink text-soft-white lg:sticky lg:top-28">
            {image ? (
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.imageUrl}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 32rem, (min-width: 1024px) 42vw, 100vw"
                  quality={92}
                  unoptimized={image.imageUrl.startsWith("http")}
                  className="object-cover"
                  style={{ objectPosition: image.focalPosition }}
                />
              </div>
            ) : null}
            <div className="p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-copper">{selection.category.label}</p>
              <h2 className="mt-2 font-serif text-4xl">{selection.tier.name}</h2>
              <dl className="mt-7 grid gap-4 text-sm text-soft-white/72">
                <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-4 text-copper" /><div><dt className="sr-only">Date</dt><dd>{formatDate(date)}</dd></div></div>
                <div className="flex items-start gap-3"><Clock3 className="mt-0.5 size-4 text-copper" /><div><dt className="sr-only">Time</dt><dd>{time}, {selection.tier.duration} (Toronto time)</dd></div></div>
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-copper" /><div><dt className="sr-only">Location</dt><dd>Toronto / GTA or your chosen venue</dd></div></div>
              </dl>
              <div className="mt-8 border-t border-soft-white/12 pt-6">
                <div className="flex items-center justify-between gap-4"><span className="text-sm text-soft-white/58">Package price</span><span className="font-serif text-2xl">{selection.tier.price}</span></div>
                <div className="mt-3 flex items-center justify-between gap-4"><span className="text-sm text-soft-white/58">Deposit after confirmation</span><span className="text-sm">{deposit ? `From ${deposit}` : "25%"}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
