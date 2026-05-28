import {
  fetchAvailability,
  type Availability,
  type DayStatus,
  type SlotStatus,
} from "@/lib/calendar";
import { Reveal } from "@/components/reveal";

/**
 * Read-only availability calendar shown on the contact page.
 * Renders nothing when GOOGLE_CALENDAR_ICAL_URL is not configured.
 *
 * Each day cell shows two indicator bars (day slot / night slot).
 * A slot can be Open (faint outline), Tentative (outlined fill), or
 * Held (solid fill). Event titles never reach the browser.
 */
export async function AvailabilityCalendar() {
  const availability = await fetchAvailability();
  if (!availability) return null;

  const { months, headline } = availabilityWindow();

  return (
    <section className="border-t border-soft-white/10 bg-charcoal px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-copper">Availability</p>
              <h2 className="mt-4 font-serif text-4xl leading-[0.96] text-soft-white sm:text-5xl">
                {headline}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-soft-white/60 lg:justify-self-end lg:text-right">
              Days split into day (before 5 PM) and night. Tentative dates I
              can usually confirm within two business days — send an inquiry
              and I will get back to you.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {months.map((m) => (
            <Reveal key={`${m.year}-${m.month}`} delay={0.05 * m.index}>
              <MonthGrid year={m.year} month={m.month} availability={availability} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function MonthGrid({
  year,
  month,
  availability,
}: {
  year: number;
  month: number;
  availability: Availability;
}) {
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-[2px] border border-soft-white/10 bg-ink/40 p-5 sm:p-6">
      <h3 className="font-serif text-2xl text-soft-white">
        {MONTH_NAMES[month]} <span className="text-soft-white/55">{year}</span>
      </h3>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.16em] text-soft-white/45">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="aspect-square" aria-hidden="true" />;
          }
          const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
          const status: DayStatus =
            availability.get(iso) ?? { day: "open", night: "open" };
          const isPast = iso < todayIso;
          const isToday = iso === todayIso;

          return (
            <DayCell
              key={i}
              dayNumber={day}
              monthName={MONTH_NAMES[month]}
              status={status}
              isPast={isPast}
              isToday={isToday}
            />
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

function DayCell({
  dayNumber,
  monthName,
  status,
  isPast,
  isToday,
}: {
  dayNumber: number;
  monthName: string;
  status: DayStatus;
  isPast: boolean;
  isToday: boolean;
}) {
  const fullyHeld = status.day === "held" && status.night === "held";
  const fullyTentative =
    status.day !== "open" &&
    status.night !== "open" &&
    !(status.day === "held" && status.night === "held");

  // Number color reacts to overall state so the cell scans at a glance.
  let numberClass = "text-soft-white/85";
  if (isPast) numberClass = "text-soft-white/25";
  else if (fullyHeld) numberClass = "text-soft-white/35 line-through";
  else if (fullyTentative) numberClass = "text-soft-white/65";

  const cellRing = isToday && !isPast ? " ring-1 ring-copper/70" : "";

  return (
    <div
      className={`relative flex aspect-square flex-col items-center justify-center rounded-[2px]${cellRing}`}
      aria-label={cellAriaLabel(monthName, dayNumber, status, isPast)}
    >
      <span className={`text-sm ${numberClass}`}>{dayNumber}</span>
      {!isPast ? (
        <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
          <SlotIndicator state={status.day} />
          <SlotIndicator state={status.night} />
        </div>
      ) : null}
    </div>
  );
}

function SlotIndicator({ state }: { state: SlotStatus }) {
  const base = "block h-1 w-3 rounded-[1px]";
  if (state === "held") return <span className={`${base} bg-soft-white/55`} />;
  if (state === "tentative")
    return <span className={`${base} bg-soft-white/12 ring-1 ring-soft-white/45`} />;
  return <span className={`${base} ring-1 ring-soft-white/15`} />;
}

function Legend() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-soft-white/55">
      <span className="text-soft-white/40">Slots: day · night</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="block h-1 w-3 rounded-[1px] ring-1 ring-soft-white/30" aria-hidden="true" />
        Open
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="block h-1 w-3 rounded-[1px] bg-soft-white/12 ring-1 ring-soft-white/45"
          aria-hidden="true"
        />
        Tentative
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="block h-1 w-3 rounded-[1px] bg-soft-white/55" aria-hidden="true" />
        Held
      </span>
    </div>
  );
}

function cellAriaLabel(
  monthName: string,
  day: number,
  status: DayStatus,
  isPast: boolean,
): string {
  const dateLabel = `${monthName} ${day}`;
  if (isPast) return `${dateLabel}, past`;
  return `${dateLabel}, day ${slotLabel(status.day)}, night ${slotLabel(status.night)}`;
}

function slotLabel(state: SlotStatus): string {
  if (state === "held") return "held";
  if (state === "tentative") return "tentative";
  return "open";
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
