import "server-only";
import ical, { type VEvent } from "node-ical";

/**
 * Read-only event listing for the admin Schedule page.
 *
 * Same source as fetchAvailability() in src/lib/calendar.ts -- the secret
 * iCal address of the "NHP Bookings" Google Calendar, via the
 * GOOGLE_CALENDAR_ICAL_URL env var -- but this returns the actual events
 * (title, time, location) instead of collapsing them into a day/night
 * open/tentative/held status. calendar.ts stays the single source for the
 * public availability calendar; this is the admin-facing sibling that reuses
 * the same feed rather than a second calendar connection.
 */

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  location: string | null;
  tentative: boolean;
};

const REVALIDATE_SECONDS = 600; // 10 min, matches fetchAvailability()
const WINDOW_PAST_DAYS = 60;
const WINDOW_FUTURE_DAYS = 270;
const TENTATIVE_PREFIX_PATTERN = /^\s*\[(t|tentative)\]\s*/i;

/**
 * Events from -60 to +270 days around today, or null if the calendar isn't
 * configured or the fetch/parse fails. Failure is silent -- the Schedule
 * page falls back to showing bookings alone.
 */
export async function fetchCalendarEvents(): Promise<GoogleCalendarEvent[] | null> {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!url) return null;

  let icsText: string;
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    icsText = await res.text();
  } catch {
    return null;
  }

  let parsed: ical.CalendarResponse;
  try {
    parsed = ical.sync.parseICS(icsText);
  } catch {
    return null;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_PAST_DAYS * 86_400_000);
  const windowEnd = new Date(now.getTime() + WINDOW_FUTURE_DAYS * 86_400_000);

  const events: GoogleCalendarEvent[] = [];

  for (const key of Object.keys(parsed)) {
    const ev = parsed[key];
    if (!ev || ev.type !== "VEVENT") continue;
    const vevent = ev as VEvent;
    if (!vevent.start) continue;

    const tentative = isTentative(vevent);
    const rawSummary = typeof vevent.summary === "string" ? vevent.summary : "";
    const title = (tentative ? rawSummary.replace(TENTATIVE_PREFIX_PATTERN, "") : rawSummary).trim() || "Busy";
    const allDay = vevent.datetype === "date";
    const location = typeof vevent.location === "string" && vevent.location.trim() ? vevent.location.trim() : null;

    if (vevent.rrule) {
      const durationMs = (vevent.end?.getTime() ?? vevent.start.getTime()) - vevent.start.getTime();
      const occurrences = vevent.rrule.between(windowStart, windowEnd, true);
      for (const occStart of occurrences) {
        const occEnd = new Date(occStart.getTime() + Math.max(durationMs, 1));
        events.push({
          id: `${vevent.uid}-${occStart.toISOString()}`,
          title,
          startIso: occStart.toISOString(),
          endIso: occEnd.toISOString(),
          allDay,
          location,
          tentative,
        });
      }
      continue;
    }

    if (vevent.start.getTime() > windowEnd.getTime() || (vevent.end ?? vevent.start).getTime() < windowStart.getTime()) {
      continue;
    }

    events.push({
      id: vevent.uid ?? `${title}-${vevent.start.toISOString()}`,
      title,
      startIso: vevent.start.toISOString(),
      endIso: (vevent.end ?? vevent.start).toISOString(),
      allDay,
      location,
      tentative,
    });
  }

  events.sort((a, b) => a.startIso.localeCompare(b.startIso));
  return events;
}

function isTentative(vevent: VEvent): boolean {
  return typeof vevent.summary === "string" && TENTATIVE_PREFIX_PATTERN.test(vevent.summary);
}
