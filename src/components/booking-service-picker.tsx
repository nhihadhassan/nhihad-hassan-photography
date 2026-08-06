import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { PricingCategory } from "@/data/pricing";
import { bookingHref } from "@/lib/booking-options";

export function BookingServicePicker({ categories }: { categories: PricingCategory[] }) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <section key={category.id} id={category.id} className="scroll-mt-28">
          <div className="grid gap-3 border-b border-soft-white/12 pb-5 sm:grid-cols-[0.7fr_1.3fr] sm:items-end">
            <h2 className="font-serif text-4xl text-soft-white sm:text-5xl">{category.label}</h2>
            <p className="max-w-xl text-sm leading-6 text-soft-white/58 sm:justify-self-end sm:text-right">
              {category.blurb}
            </p>
          </div>
          <div className="divide-y divide-soft-white/10">
            {category.tiers.map((tier) => (
              <article
                key={tier.name}
                className="grid gap-5 py-6 md:grid-cols-[0.7fr_0.55fr_1.35fr_auto] md:items-center"
              >
                <div>
                  <h3 className="text-base font-medium text-soft-white">{tier.name}</h3>
                  <p className="mt-1 text-sm text-copper">{tier.duration}</p>
                </div>
                <p className="font-serif text-3xl text-soft-white">{tier.price}</p>
                <ul className="grid gap-1.5">
                  {tier.includes.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-5 text-soft-white/62">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-copper" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={bookingHref(category.id, tier.name)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-copper/65 bg-copper px-5 text-sm font-medium text-ink transition hover:border-beige hover:bg-beige"
                >
                  Choose
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
