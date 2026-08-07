"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, CircleCheck } from "lucide-react";
import type { PricingCategory } from "@/data/pricing";
import { bookingHref } from "@/lib/booking-options";
import { useSelectedDate } from "@/components/selected-date-context";

const VALUE_SEPARATOR = "";
const CUSTOM_PACKAGE = "custom-package";

/**
 * Path 1 of the contact page: the quick route for visitors who already know
 * what they want. Picking a service and continuing drops them straight into
 * that package's booking/availability flow; with nothing chosen, the button
 * simply scrolls down to the full package list. The chosen service label is
 * also shared (via SelectedDateContext) so the inquiry form's shoot-type
 * field can prefill.
 */
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

    // Nothing picked yet: send them down to browse the full package list.
    if (!selection) {
      document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (selection === CUSTOM_PACKAGE) {
      router.push("/book/custom");
      return;
    }

    const [serviceId, packageName] = selection.split(VALUE_SEPARATOR);
    if (!serviceId || !packageName) return;

    router.push(bookingHref(serviceId, packageName));
  }

  const hasSelection = Boolean(selection);
  const buttonLabel = !hasSelection
    ? "View packages"
    : selection === CUSTOM_PACKAGE
      ? "Build custom"
      : "Continue to dates";

  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-copper">
          Find your session
        </p>
        <span className="h-px flex-1 bg-soft-white/12" aria-hidden="true" />
      </div>
      <p id="service-select-help" className="mt-4 text-sm leading-6 text-soft-white/60">
        Choose a service to see available dates and times.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Select service</span>
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
        </label>
        <button
          type="submit"
          className={
            hasSelection
              ? "inline-flex min-h-14 items-center justify-center gap-2 rounded-[2px] border border-copper bg-copper px-6 text-xs font-medium uppercase tracking-[0.16em] text-ink transition hover:border-beige hover:bg-beige"
              : "inline-flex min-h-14 items-center justify-center gap-2 rounded-[2px] border border-copper/55 px-6 text-xs font-medium uppercase tracking-[0.16em] text-copper transition hover:border-copper hover:bg-copper/10"
          }
        >
          {buttonLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-soft-white/55">
        <CircleCheck className="size-4 shrink-0 text-copper" aria-hidden="true" />
        {hasSelection
          ? "Great — continue to see available dates and times."
          : "Perfect if you already know what you're looking for."}
      </p>
    </div>
  );
}
