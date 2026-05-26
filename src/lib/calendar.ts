import "server-only";
import ical, { type VEvent } from "node-ical";

/**
 * Read-only availability calendar.
 *
 * Source: the secret iCal URL of a Google Calendar (Settings -> Settings for
 * my calendars -> [calendar] -> "Secret address in iCal format"). Treat the
 * URL as a password — it is set via the GOOGLE_CALENDAR_ICAL_URL env var and
 * only fetched server-side. The browser never sees the URL or event titles.
 *
 * Day-level granularity: any event on a given day (or spanning it) marks
 * that day as busy. We do not look at times — wedding / event coverage is a
 * full-day commitment, so "is May 24 open?" is the only question that
 * matters for the contact page.
 */

export type BusyDates = ReadonlySet<string>; // entries are "YYYY-MM-DD" in TZ

const TZ = "America/Toronto";
const REVALIDATE_SECONDS = 600; // 10 min — calendar changes infrequently

/**
 * Returns the set of busy dates ("YYYY-MM-DD") in Toronto time across the
 * lookahead window, or null if the calendar isn't configured / fetch fails.
 * Failure is silent on purpose — the contact page renders fine without it.
 */
export async function fetchBusyDates(): Promise<BusyDates | null> {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!url) return null;

  let icsText: string;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    icsText = await res.text();
  } catch {
    return null;
  }

  let events: ical.CalendarResponse;
  try {
    events = ical.sync.parseICS(icsText);
  } catch {
    return null;
  }

  const busy = new Set<string>();
  const today = startOfTodayUTC();
  const horizon = availabilityHorizonUTC(today);

  for (const key of Object.keys(events)) {
    const ev = events[key];
    if (!ev || ev.type !== "VEVENT") continue;
    const vevent = ev as VEvent;
    if (!vevent.start) continue;

    if (vevent.rrule) {
      // Recurring: expand into the window.
      const durationMs =
        (vevent.end?.getTime() ?? vevent.start.getTime()) - vevent.start.getTime();
      const occurrences = vevent.rrule.between(today, horizon, true);
      for (const occStart of occurrences) {
        const occEnd = new Date(occStart.getTime() + Math.max(durationMs, 1));
        markRange(busy, occStart, occEnd);
      }
      continue;
    }

    markRange(busy, vevent.start, vevent.end ?? new Date(vevent.start.getTime() + 1));
  }

  return busy;
}

/** Iterate calendar days from start to end (end exclusive) and mark each. */
function markRange(busy: Set<string>, startDate: Date, endDate: Date) {
  // Use UTC day arithmetic and format each day in Toronto TZ for stability.
  let cursor = startOfDayUTC(startDate);
  const stop = endDate.getTime();
  const safetyCap = 365; // never iterate more than a year per event
  let i = 0;

  while (cursor.getTime() < stop && i < safetyCap) {
    busy.add(toTZDate(cursor));
    cursor = addDaysUTC(cursor, 1);
    i++;
  }

  // Edge case: same-day event where end <= start (single-instant event).
  if (i === 0) {
    busy.add(toTZDate(startDate));
  }
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfTodayUTC(): Date {
  return startOfDayUTC(new Date());
}

function addDaysUTC(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

/**
 * Match the UI's seasonal window in availability-calendar.tsx:
 *  - In peak booking season (May–October): fetch through end of October.
 *  - Off-season (November–April): rolling ~3-month window.
 * Keep aligned with availabilityWindow() in availability-calendar.tsx.
 */
function availabilityHorizonUTC(today: Date): Date {
  const month = today.getUTCMonth();
  const MAY = 4;
  const OCTOBER = 9;
  const inPeakSeason = month >= MAY && month <= OCTOBER;

  if (inPeakSeason) {
    const year = today.getUTCFullYear();
    return new Date(Date.UTC(year, OCTOBER + 1, 1)); // Nov 1
  }
  return addDaysUTC(today, 95);
}

/** Format a Date as YYYY-MM-DD in the Toronto timezone. */
function toTZDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${day}`;
}
