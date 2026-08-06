"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import type { DayStatus } from "@/lib/calendar";
import { bookingDetailsHref, durationMinutes } from "@/lib/booking-options";
import { ButtonLink } from "@/components/ui/button";

type Props = {
  availability: [string, DayStatus][];
  serviceId: string;
  packageName: string;
  duration: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingScheduler({ availability, serviceId, packageName, duration }: Props) {
  const available = useMemo(() => new Map(availability), [availability]);
  const today = useMemo(() => new Date(), []);
  const sessionMinutes = durationMinutes(duration);
  const firstAvailable = useMemo(
    () => findFirstAvailableDate(available, today, sessionMinutes),
    [available, today, sessionMinutes],
  );
  const todayKey = localDateKey(today);
  const [monthOffset, setMonthOffset] = useState(firstAvailable?.monthOffset ?? 0);
  const [selectedDate, setSelectedDate] = useState<string | null>(firstAvailable?.date ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const shownMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const dayStatus = selectedDate
    ? available.get(selectedDate) ?? { day: "open", night: "open" }
    : null;
  const slots = dayStatus ? buildTimeSlots(dayStatus, sessionMinutes) : [];

  function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  return (
    <div className="grid border-x border-b border-ink/10 bg-[#f8f3eb] lg:grid-cols-[1fr_0.9fr]">
      <section className="p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8b6444]">Choose a date</p>
            <h2 className="mt-2 font-serif text-3xl text-ink">
              {MONTHS[month]} {year}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={monthOffset === 0}
              onClick={() => setMonthOffset((value) => Math.max(0, value - 1))}
              className="grid size-11 place-items-center rounded-full border border-ink/14 text-ink transition hover:border-copper disabled:cursor-not-allowed disabled:opacity-25"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={monthOffset === 5}
              onClick={() => setMonthOffset((value) => Math.min(5, value + 1))}
              className="grid size-11 place-items-center rounded-full border border-ink/14 text-ink transition hover:border-copper disabled:cursor-not-allowed disabled:opacity-25"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.14em] text-ink/48 sm:gap-2">
          {DAY_LABELS.map((label) => <span key={label} className="py-2">{label}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, index) => {
            if (!day) return <span key={`blank-${index}`} aria-hidden="true" />;
            const date = `${year}-${pad(month + 1)}-${pad(day)}`;
            const status = available.get(date) ?? { day: "open", night: "open" };
            const past = date < todayKey;
            const held = status.day === "held" && status.night === "held";
            const disabled = past || held;
            const selected = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={`${MONTHS[month]} ${day}${held ? ", unavailable" : ""}`}
                onClick={() => selectDate(date)}
                className={`relative grid aspect-square min-h-10 place-items-center rounded-[2px] text-sm transition sm:min-h-12 ${
                  selected
                    ? "bg-ink text-soft-white"
                    : disabled
                      ? "cursor-not-allowed text-ink/24 line-through"
                      : "bg-copper/8 text-ink hover:bg-copper/18"
                }`}
              >
                {day}
                {!disabled && !selected ? <span className="absolute bottom-1.5 size-1 rounded-full bg-copper" /> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-ink/52">
          <span className="size-1.5 rounded-full bg-copper" aria-hidden="true" />
          Times shown are in Toronto time and remain subject to confirmation.
        </p>
      </section>

      <section className="flex min-h-[420px] flex-col p-5 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8b6444]">Choose a time</p>
          <h2 className="mt-2 font-serif text-3xl text-ink">
            {selectedDate ? formatDate(selectedDate) : "Select a date first"}
          </h2>
          <p className="mt-2 text-sm text-ink/52">{duration} session</p>
        </div>

        {selectedDate ? (
          slots.length ? (
            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot.label}
                  onClick={() => setSelectedTime(slot.label)}
                  aria-pressed={selectedTime === slot.label}
                  className={`min-h-12 rounded-[2px] border px-3 text-sm transition ${
                    selectedTime === slot.label
                      ? "border-ink bg-ink text-soft-white"
                      : "border-ink/12 bg-soft-white/60 text-ink hover:border-copper"
                  }`}
                >
                  {slot.label}
                  {slot.tentative ? <span className="block text-[10px] opacity-60">Limited</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-8 border-t border-ink/10 pt-6 text-sm leading-6 text-ink/58">
              There are no times that fit this package on that date. Try another date or email to ask about a custom start time.
            </p>
          )
        ) : (
          <div className="grid flex-1 place-items-center py-12 text-center">
            <div>
              <CalendarDays className="mx-auto size-7 text-copper" aria-hidden="true" />
              <p className="mt-4 max-w-xs text-sm leading-6 text-ink/52">
                Pick an available day and the matching start times will appear here.
              </p>
            </div>
          </div>
        )}

        {selectedDate && selectedTime ? (
          <div className="mt-auto border-t border-ink/10 pt-6">
            <p className="mb-4 flex items-center gap-2 text-sm text-ink/64">
              <Clock3 className="size-4 text-copper" aria-hidden="true" />
              {formatDate(selectedDate)} at {selectedTime} (EST)
            </p>
            <ButtonLink
              href={bookingDetailsHref({ serviceId, packageName, date: selectedDate, time: selectedTime })}
              variant="light"
              className="w-full"
            >
              Continue to your details
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function findFirstAvailableDate(
  availability: Map<string, DayStatus>,
  today: Date,
  duration: number,
) {
  for (let monthOffset = 0; monthOffset <= 5; monthOffset += 1) {
    const shownMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = shownMonth.getFullYear();
    const month = shownMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = monthOffset === 0 ? today.getDate() : 1;

    for (let day = firstDay; day <= days; day += 1) {
      const date = `${year}-${pad(month + 1)}-${pad(day)}`;
      const status = availability.get(date) ?? { day: "open", night: "open" };
      if (buildTimeSlots(status, duration).length > 0) {
        return { date, monthOffset };
      }
    }
  }

  return null;
}

function buildTimeSlots(status: DayStatus, duration: number) {
  const result: Array<{ label: string; tentative: boolean }> = [];
  for (let start = 9 * 60; start + duration <= 22 * 60; start += 30) {
    const touchesDay = start < 17 * 60;
    const touchesNight = start + duration > 17 * 60;
    if ((touchesDay && status.day === "held") || (touchesNight && status.night === "held")) continue;
    result.push({
      label: formatTime(start),
      tentative:
        (touchesDay && status.day === "tentative") ||
        (touchesNight && status.night === "tentative"),
    });
  }
  return result;
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
