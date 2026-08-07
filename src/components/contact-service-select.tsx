"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { PricingCategory } from "@/data/pricing";
import { bookingHref } from "@/lib/booking-options";
import { useSelectedDate } from "@/components/selected-date-context";

const VALUE_SEPARATOR = "\u001f";
const CUSTOM_PACKAGE = "custom-package";

export function ContactServiceSelect({ categories }: { categories: PricingCategory[] }) {
  const router = useRouter();
  const [selection, setSelection] = useState("");
  const { setSelectedService } = useSelectedDate();

  function handleServiceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setSelection(value);

    if (!value) {
      setSelectedService(null);
      return;
    }
    if (value === CUSTOM_PACKAGE) {
      setSelectedService("Custom package");
      return;
    }
    const [serviceId] = value.split(VALUE_SEPARATOR);
    const category = categories.find((item) => item.id === serviceId);
    setSelectedService(category?.label ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection) return;

    if (selection === CUSTOM_PACKAGE) {
      router.push("/book/custom");
      return;
    }

    const [serviceId, packageName] = selection.split(VALUE_SEPARATOR);
    if (!serviceId || !packageName) return;

    router.push(bookingHref(serviceId, packageName));
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl lg:justify-self-end">
      <p className="font-serif text-3xl leading-tight text-soft-white sm:text-4xl">
        Find your session.
      </p>
      <p id="service-select-help" className="mt-4 max-w-lg text-sm leading-6 text-soft-white/60">
        Choose a package to go straight to its available dates and times.
      </p>

      <label className="mt-8 block">
        <span className="text-xs uppercase tracking-[0.2em] text-copper">Select service</span>
        <span className="relative mt-3 block">
          <select
            name="service"
            value={selection}
            onChange={handleServiceChange}
            aria-describedby="service-select-help"
            className="min-h-14 w-full appearance-none rounded-[2px] border border-soft-white/18 bg-charcoal px-4 pr-12 text-base text-soft-white outline-none transition hover:border-soft-white/32 focus:border-copper"
          >
            <option value="">Choose a service</option>
            {categories.map((category) => (
              <optgroup key={category.id} label={category.label}>
                {category.tiers.map((tier) => (
                  <option
                    key={`${category.id}-${tier.name}`}
                    value={`${category.id}${VALUE_SEPARATOR}${tier.name}`}
                  >
                    {tier.name} · {tier.duration} · {tier.price}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Something different">
              <option value={CUSTOM_PACKAGE}>Request a custom package</option>
            </optgroup>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-copper"
            aria-hidden="true"
          />
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!selection}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-copper/65 bg-copper px-6 text-sm font-medium text-ink transition hover:border-beige hover:bg-beige disabled:cursor-not-allowed disabled:border-soft-white/12 disabled:bg-soft-white/8 disabled:text-soft-white/35"
        >
          {selection === CUSTOM_PACKAGE ? "Build a custom package" : "Continue to dates"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <a href="#sessions" className="text-sm text-soft-white/55 underline-offset-4 transition hover:text-soft-white hover:underline">
          Compare all packages
        </a>
      </div>
    </form>
  );
}
