const TZ = "America/Toronto";

/** Minutes that Toronto wall-clock time is offset from UTC at the given instant. */
function torontoOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "00" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

/**
 * Convert a wall-clock datetime entered as Toronto local time (e.g. the value
 * of a <input type="datetime-local"> like "2026-08-15T18:00") into a UTC Date.
 */
export function torontoLocalToUtc(localValue: string): Date | null {
  if (!localValue) return null;
  // datetime-local is "YYYY-MM-DDTHH:MM" (16 chars) or with seconds.
  const withSeconds = localValue.length === 16 ? `${localValue}:00` : localValue;
  // Treat the components as if they were UTC, then correct by Toronto's offset.
  const guess = new Date(`${withSeconds}Z`);
  if (Number.isNaN(guess.getTime())) return null;
  const offset = torontoOffsetMinutes(guess);
  return new Date(guess.getTime() - offset * 60000);
}

/** A UTC Date formatted for a <input type="datetime-local"> in Toronto time. */
export function utcToTorontoLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts: Record<string, string> = {};
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

function formatICSDateUTC(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long lines to 75 octets per the iCalendar spec. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return chunks.join("\r\n");
}

export type ICSEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location?: string;
  description?: string;
  organizerName?: string;
  organizerEmail?: string;
  url?: string;
};

/** Build a single-event iCalendar (.ics) document. */
export function buildICS(event: ICSEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nhihad Hassan Photography//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatICSDateUTC(new Date())}`,
    `DTSTART:${formatICSDateUTC(event.start)}`,
    `DTEND:${formatICSDateUTC(event.end)}`,
    `SUMMARY:${escapeICS(event.summary)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  if (event.url) lines.push(`URL:${escapeICS(event.url)}`);
  if (event.organizerEmail) {
    const cn = event.organizerName ? `;CN=${escapeICS(event.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${event.organizerEmail}`);
  }
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}
