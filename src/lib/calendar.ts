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
 * Each day has two slots: day (before 5pm Toronto) and night (5pm onwards).
 * An event is classified per day it touches as day-only, night-only, or
 * full (spans the cutoff or is all-day). Each slot is then merged with the
 * day's existing status, with the precedence: held > tentative > open.
 *
 * Tentative is signalled by a title prefix of [T] or [TENTATIVE] (case-
 * insensitive). The prefix is server-side only and never reaches the
 * browser — clients only see the resulting status.
 */

export type SlotStatus = "open" | "tentative" | "held";

export type DayStatus = {
  day: SlotStatus;
  night: SlotStatus;
};

export type Availability = ReadonlyMap<string, DayStatus>; // key: "YYYY-MM-DD" in TZ

const TZ = "America/Toronto";
const REVALIDATE_SECONDS = 600; // 10 min — calendar changes infrequently
/** Hour-of-day in Toronto local time that separates day and night slots. */
const DAY_NIGHT_CUTOFF_HOUR = 17;
/** Title prefixes that mark an event as tentative. Match case-insensitive at the very start. */
const TENTATIVE_PREFIX_PATTERN = /^\s*\[(t|tentative)\]\s*/i;

/**
 * Returns a per-day availability map across the lookahead window, or null
 * if the calendar isn't configured or the fetch / parse fails. Failure is
 * silent — the contact page renders fine without it.
 */
export async function fetchAvailability(): Promise<Availability | null> {
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

  const map = new Map<string, DayStatus>();
  const today = startOfTodayUTC();
  const horizon = availabilityHorizonUTC(today);

  for (const key of Object.keys(events)) {
    const ev = events[key];
    if (!ev || ev.type !== "VEVENT") continue;
    const vevent = ev as VEvent;
    if (!vevent.start) continue;

    const tentative = isTentative(vevent);
    const baseStatus: SlotStatus = tentative ? "tentative" : "held";

    if (vevent.rrule) {
      const durationMs =
        (vevent.end?.getTime() ?? vevent.start.getTime()) - vevent.start.getTime();
      const occurrences = vevent.rrule.between(today, horizon, true);
      for (const occStart of occurrences) {
        const occEnd = new Date(occStart.getTime() + Math.max(durationMs, 1));
        applyEvent(map, occStart, occEnd, isAllDay(vevent), baseStatus);
      }
      continue;
    }

    applyEvent(
      map,
      vevent.start,
      vevent.end ?? new Date(vevent.start.getTime() + 1),
      isAllDay(vevent),
      baseStatus,
    );
  }

  return map;
}

function isTentative(vevent: VEvent): boolean {
  return typeof vevent.summary === "string" && TENTATIVE_PREFIX_PATTERN.test(vevent.summary);
}

/**
 * Detect all-day events. node-ical sets `datetype` to "date" for VALUE=DATE
 * (all-day) events. As a fallback, treat an event whose Toronto-local start
 * is at midnight and duration is a positive multiple of 24h as all-day.
 */
function isAllDay(vevent: VEvent): boolean {
  if (vevent.datetype === "date") return true;
  if (!vevent.end) return false;
  const startMins = toTZParts(vevent.start).hour * 60 + toTZParts(vevent.start).minute;
  const durationMs = vevent.end.getTime() - vevent.start.getTime();
  return startMins === 0 && durationMs > 0 && durationMs % 86_400_000 === 0;
}

/**
 * For each day this event touches, compute slot impact and merge into the map.
 *
 * Days are reckoned in Toronto time so an evening or all-day event lands on the
 * correct local date (UTC-based day iteration shifted everything back a day).
 */
function applyEvent(
  map: Map<string, DayStatus>,
  startDate: Date,
  endDate: Date,
  allDay: boolean,
  status: SlotStatus,
) {
  if (allDay) {
    // All-day events carry no real time: take their calendar dates at face
    // value (node-ical gives UTC-midnight starts; DTEND is exclusive).
    let cursor = startOfDayUTC(startDate);
    const stop = endDate.getTime();
    if (stop <= cursor.getTime()) {
      mergeInto(map, utcDateKey(cursor), { day: true, night: true }, status);
      return;
    }
    let i = 0;
    while (cursor.getTime() < stop && i < 366) {
      mergeInto(map, utcDateKey(cursor), { day: true, night: true }, status);
      cursor = addDaysUTC(cursor, 1);
      i++;
    }
    return;
  }

  // Timed event: walk each Toronto calendar day from start to end (inclusive).
  const startKey = toTZDate(startDate);
  const lastInstant = new Date(Math.max(endDate.getTime() - 1, startDate.getTime()));
  const endKey = toTZDate(lastInstant);

  let key = startKey;
  let guard = 0;
  while (guard < 366) {
    mergeInto(map, key, slotsTouchedTZ(startDate, endDate, key), status);
    if (key === endKey) break;
    key = nextDateKey(key);
    guard++;
  }
}

/**
 * Which slots (day / night) a timed event covers on a given Toronto calendar
 * day, using that day's real Toronto midnight and 5pm boundaries.
 */
function slotsTouchedTZ(
  eventStart: Date,
  eventEnd: Date,
  dateKey: string,
): { day: boolean; night: boolean } {
  const dayStart = tzMidnightMs(dateKey);
  const cutoff = dayStart + DAY_NIGHT_CUTOFF_HOUR * 3_600_000;
  const dayEnd = tzMidnightMs(nextDateKey(dateKey));

  const segStart = Math.max(eventStart.getTime(), dayStart);
  const segEnd = Math.min(eventEnd.getTime(), dayEnd);
  if (segEnd <= segStart) return { day: false, night: false };

  return {
    day: segStart < cutoff,
    night: segEnd > cutoff,
  };
}

/** YYYY-MM-DD from a Date's UTC parts (used for face-value all-day dates). */
function utcDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** The day after a YYYY-MM-DD key. */
function nextDateKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return utcDateKey(new Date(Date.UTC(y, m - 1, d + 1)));
}

/** UTC milliseconds of Toronto-local midnight for a YYYY-MM-DD date. */
function tzMidnightMs(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d);
  const p = toTZParts(new Date(utcGuess));
  const wall = Date.UTC(Number(p.year), p.month - 1, p.day, p.hour, p.minute);
  const offset = wall - utcGuess; // how far Toronto wall time is from UTC
  return utcGuess - offset;
}

function mergeInto(
  map: Map<string, DayStatus>,
  dayKey: string,
  slots: { day: boolean; night: boolean },
  status: SlotStatus,
) {
  if (!slots.day && !slots.night) return;
  const existing = map.get(dayKey) ?? { day: "open", night: "open" };
  map.set(dayKey, {
    day: slots.day ? mergeSlot(existing.day, status) : existing.day,
    night: slots.night ? mergeSlot(existing.night, status) : existing.night,
  });
}

function mergeSlot(a: SlotStatus, b: SlotStatus): SlotStatus {
  if (a === "held" || b === "held") return "held";
  if (a === "tentative" || b === "tentative") return "tentative";
  return "open";
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
  const { year, month, day } = toTZParts(d);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function toTZParts(d: Date): {
  year: string;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24, // Intl can render "24" for midnight
    minute: Number(get("minute")),
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
