import { fetchBusyDates, type BusyDates } from "@/lib/calendar";
import { Reveal } from "@/components/reveal";

/**
 * Read-only availability calendar shown on the contact page.
 * Renders nothing when GOOGLE_CALENDAR_ICAL_URL is not configured.
 *
 * Day-level only. Booked days are greyed out with a "Held" pill;
 * event titles and times never leave the server.
 */
export async function AvailabilityCalendar() {
  const busy = await fetchBusyDates();
  if (!busy) return null;

  const months = nextThreeMonths();

  return (
    <section className="border-t border-soft-white/10 bg-charcoal px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-copper">Availability</p>
              <h2 className="mt-4 font-serif text-4xl leading-[0.96] text-soft-white sm:text-5xl">
                Open dates over the next three months.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-soft-white/60 lg:justify-self-end lg:text-right">
              Days look open as of the most recent sync. Confirm the date in
              your inquiry — I will hold it once we have spoken.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {months.map((m) => (
            <Reveal key={`${m.year}-${m.month}`} delay={0.05 * m.index}>
              <MonthGrid year={m.year} month={m.month} busy={busy} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

type MonthMeta = { year: number; month: number; index: number };

function nextThreeMonths(): MonthMeta[] {
  const now = new Date();
  return [0, 1, 2].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth(), index: offset };
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function MonthGrid({
  year,
  month,
  busy,
}: {
  year: number;
  month: number;
  busy: BusyDates;
}) {
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to full weeks for grid consistency
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
          const isBusy = busy.has(iso);
          const isPast = iso < todayIso;
          const isToday = iso === todayIso;

          const base =
            "relative flex aspect-square items-center justify-center rounded-[2px] text-sm";
          let stateClass = "text-soft-white/85"; // available, default
          if (isPast) stateClass = "text-soft-white/25";
          else if (isBusy) stateClass = "bg-soft-white/8 text-soft-white/35 line-through";
          if (isToday && !isBusy && !isPast) {
            stateClass += " ring-1 ring-copper/70";
          }

          return (
            <div
              key={i}
              className={`${base} ${stateClass}`}
              aria-label={
                isBusy
                  ? `${MONTH_NAMES[month]} ${day} — held`
                  : isPast
                    ? `${MONTH_NAMES[month]} ${day} — past`
                    : `${MONTH_NAMES[month]} ${day} — available`
              }
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-4 text-[11px] text-soft-white/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[2px] ring-1 ring-soft-white/30" aria-hidden="true" />
          Open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[2px] bg-soft-white/20" aria-hidden="true" />
          Held
        </span>
      </div>
    </div>
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
