"use client";

import { useMemo } from "react";
import type { DayStatus, SlotStatus } from "@/lib/calendar";
import { useSelectedDate } from "@/components/selected-date-context";
import { Reveal } from "@/components/reveal";

/**
 * Interactive renderer for the availability calendar.
 *
 * Data comes in serialized (array of [date, status] tuples) because Maps
 * don't cross the server/client boundary cleanly. We rebuild the Map
 * once with useMemo.
 *
 * Open and Tentative cells are clickable — clicking one selects that
 * date and the ContactForm's date field syncs via SelectedDateContext.
 * Held and past cells are visually non-interactive.
 */

type Props = {
  availability: [string, DayStatus][];
  headline: string;
  months: { year: number; month: number; index: number }[];
};

export function AvailabilityCalendarClient({ availability, headline, months }: Props) {
  const availMap = useMemo(() => new Map(availability), [availability]);
  const { selectedDate, setSelectedDate } = useSelectedDate();

  return (
    <section className="bg-charcoal px-4 pb-20 pt-32 sm:px-6 sm:pt-40 lg:px-8 lg:pb-24">
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
              Click an open or tentative day to pick it for your inquiry.
              Tentative dates I usually confirm within two business days.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {months.map((m) => (
            <Reveal key={`${m.year}-${m.month}`} delay={0.05 * m.index}>
              <MonthGrid
                year={m.year}
                month={m.month}
                availability={availMap}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
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
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  availability: Map<string, DayStatus>;
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
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
          const isSelected = iso === selectedDate;
          const fullyHeld = status.day === "held" && status.night === "held";
          const isInteractive = !isPast && !fullyHeld;

          return (
            <DayCell
              key={i}
              iso={iso}
              dayNumber={day}
              monthName={MONTH_NAMES[month]}
              status={status}
              isPast={isPast}
              isToday={isToday}
              isSelected={isSelected}
              fullyHeld={fullyHeld}
              isInteractive={isInteractive}
              onSelect={() => onSelect(iso)}
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
  isSelected,
  fullyHeld,
  isInteractive,
  onSelect,
}: {
  iso: string;
  dayNumber: number;
  monthName: string;
  status: DayStatus;
  isPast: boolean;
  isToday: boolean;
  isSelected: boolean;
  fullyHeld: boolean;
  isInteractive: boolean;
  onSelect: () => void;
}) {
  const fullyTentative =
    !fullyHeld &&
    status.day !== "open" &&
    status.night !== "open";

  // Number color reacts to overall state.
  let numberClass = "text-soft-white/85";
  if (isPast) numberClass = "text-soft-white/25";
  else if (fullyHeld) numberClass = "text-soft-white/35 line-through";
  else if (fullyTentative) numberClass = "text-soft-white/65";

  // Container styling: selected wins, then today-ring, then nothing.
  let containerClass =
    "relative flex aspect-square flex-col items-center justify-center rounded-[2px]";
  if (isSelected) {
    containerClass += " bg-copper/85 text-ink ring-2 ring-copper";
    numberClass = "text-ink font-medium";
  } else if (isToday && !isPast) {
    containerClass += " ring-1 ring-copper/70";
  }

  if (isInteractive && !isSelected) {
    containerClass += " transition hover:bg-soft-white/8";
  }

  const ariaLabel = cellAriaLabel(monthName, dayNumber, status, isPast, isSelected);

  const inner = (
    <>
      <span className={`text-sm ${numberClass}`}>{dayNumber}</span>
      {!isPast ? (
        <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
          <SlotIndicator state={status.day} selected={isSelected} />
          <SlotIndicator state={status.night} selected={isSelected} />
        </div>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={containerClass}
        aria-pressed={isSelected}
        aria-label={ariaLabel}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={containerClass} aria-label={ariaLabel}>
      {inner}
    </div>
  );
}

function SlotIndicator({ state, selected }: { state: SlotStatus; selected: boolean }) {
  const base = "block h-1 w-3 rounded-[1px]";
  // On a selected (copper) cell, swap to ink-toned bars so they stay visible.
  if (selected) {
    if (state === "held") return <span className={`${base} bg-ink/70`} />;
    if (state === "tentative")
      return <span className={`${base} bg-ink/15 ring-1 ring-ink/60`} />;
    return <span className={`${base} ring-1 ring-ink/35`} />;
  }
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
        <span
          className="block h-1 w-3 rounded-[1px] ring-1 ring-soft-white/30"
          aria-hidden="true"
        />
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
  isSelected: boolean,
): string {
  const dateLabel = `${monthName} ${day}`;
  if (isPast) return `${dateLabel}, past`;
  const sel = isSelected ? ", selected for inquiry" : "";
  return `${dateLabel}, day ${slotLabel(status.day)}, night ${slotLabel(status.night)}${sel}`;
}

function slotLabel(state: SlotStatus): string {
  if (state === "held") return "held";
  if (state === "tentative") return "tentative";
  return "open";
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
