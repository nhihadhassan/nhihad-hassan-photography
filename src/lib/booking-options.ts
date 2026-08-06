import type { PricingCategory, PricingTier } from "@/data/pricing";

export type BookingSelection = {
  category: PricingCategory;
  tier: PricingTier;
};

export function findBookingSelection(
  categories: PricingCategory[],
  serviceId: string,
  packageName: string,
): BookingSelection | null {
  const category = categories.find((item) => item.id === serviceId);
  const tier = category?.tiers.find((item) => item.name === packageName);
  return category && tier ? { category, tier } : null;
}
export function bookingHref(serviceId: string, packageName: string) {
  const query = new URLSearchParams({ service: serviceId, package: packageName });
  return `/book?${query.toString()}`;
}

export function bookingDetailsHref(input: {
  serviceId: string;
  packageName: string;
  date: string;
  time: string;
}) {
  const query = new URLSearchParams({
    service: input.serviceId,
    package: input.packageName,
    date: input.date,
    time: input.time,
  });
  return `/book/details?${query.toString()}`;
}

/** Use the shortest advertised duration when a package contains a range. */
export function durationMinutes(duration: string): number {
  const normalized = duration.toLowerCase();
  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*(?:–|-|to)?\s*(?:\d+(?:\.\d+)?)?\s*hours?/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const minutes = normalized.match(/(\d+)\s*minutes?/);
  if (minutes) return Number(minutes[1]);
  return 60;
}

export function startingPrice(price: string): number | null {
  const match = price.replaceAll(",", "").match(/\$\s*(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}
