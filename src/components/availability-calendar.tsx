import { fetchAvailability } from "@/lib/calendar";
import { AvailabilityCalendarClient } from "@/components/availability-calendar-client";

/**
 * Read-only availability calendar shown on the contact page.
 * Server entry point: fetches the calendar feed, serializes the data to
 * plain tuples (Maps don't cross the server/client boundary), and hands
 * everything to the client component for interactive rendering.
 *
 * Returns null when GOOGLE_CALENDAR_ICAL_URL is not configured.
 */
export async function AvailabilityCalendar() {
  const availability = await fetchAvailability();
  if (!availability) return null;

  const { months, headline } = availabilityWindow();
  const serialized = Array.from(availability.entries());

  return (
    <AvailabilityCalendarClient
      availability={serialized}
      headline={headline}
      months={months}
    />
  );
}

type MonthMeta = { year: number; month: number; index: number };

/**
 * Peak booking season (May–October): show every month from the current
 * month through October. Off-season (November–April): rolling three-month
 * view. Returns the months to render plus a matching headline so the two
 * can't drift apart.
 *
 * Keep this in sync with availabilityHorizonUTC() in lib/calendar.ts —
 * the backend fetches the same window of events.
 */
function availabilityWindow(): { months: MonthMeta[]; headline: string } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const MAY = 4;
  const OCTOBER = 9;
  const inPeakSeason = currentMonth >= MAY && currentMonth <= OCTOBER;

  const monthCount = inPeakSeason ? OCTOBER - currentMonth + 1 : 3;
  const months: MonthMeta[] = Array.from({ length: monthCount }, (_, offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth(), index: offset };
  });

  const headline = inPeakSeason
    ? "Open dates through October."
    : "Open dates over the next three months.";

  return { months, headline };
}
