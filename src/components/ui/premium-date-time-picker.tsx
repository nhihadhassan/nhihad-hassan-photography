"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

const times = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 ? 30 : 0;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
  return { value, label };
});

function keyFor(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function torontoTodayKey() {
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())) {
    parts[part.type] = part.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dateLabel(value: string) {
  if (!value) return "Choose date";
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function timeLabel(value: string) {
  if (!value) return "Choose time";
  return times.find((time) => time.value === value)?.label ?? value;
}

export function PremiumDateTimePicker({
  label,
  dateName,
  timeName,
}: {
  label: string;
  dateName: string;
  timeName: string;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date(`${torontoTodayKey()}T12:00:00`);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const todayKey = torontoTodayKey();
  const today = new Date(`${todayKey}T12:00:00`);
  const monthLabel = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
  }).format(month);
  const firstDay = month.getDay();
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return (
    <div className="grid gap-1.5 sm:col-span-2">
      <span className="text-xs font-medium text-admin-ink/70">{label}</span>
      <input type="hidden" name={dateName} value={date} />
      <input type="hidden" name={timeName} value={time} />
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-admin-ink/12 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 items-center gap-3 border-r border-admin-ink/10 px-3.5 text-left transition hover:bg-admin-ink/[0.025] active:bg-admin-ink/[0.045]"
        >
          <CalendarDays className="size-4 shrink-0 text-admin-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-ink/40">Date</span>
            <span className={`block truncate text-sm font-medium ${date ? "text-admin-ink" : "text-admin-ink/50"}`}>
              {dateLabel(date)}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 items-center gap-3 px-3.5 text-left transition hover:bg-admin-ink/[0.025] active:bg-admin-ink/[0.045]"
        >
          <Clock3 className="size-4 shrink-0 text-admin-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-ink/40">Time</span>
            <span className={`block truncate text-sm font-medium ${time ? "text-admin-ink" : "text-admin-ink/50"}`}>
              {timeLabel(time)}
            </span>
          </span>
        </button>
      </div>

      {open ? (
        <div className="overflow-hidden rounded-xl border border-admin-ink/12 bg-white/90 shadow-[0_18px_45px_rgba(43,35,28,0.10)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_13rem]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
                  className="grid size-8 place-items-center rounded-full text-admin-ink/55 transition hover:bg-admin-ink/6 active:scale-95"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <span className="text-sm font-semibold">{monthLabel}</span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
                  className="grid size-8 place-items-center rounded-full text-admin-ink/55 transition hover:bg-admin-ink/6 active:scale-95"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-admin-ink/35">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`} className="py-2">{day}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={monthLabel}>
                {Array.from({ length: 42 }, (_, index) => {
                  const day = index - firstDay + 1;
                  if (day < 1 || day > dayCount) return <span className="aspect-square" key={index} />;
                  const candidate = new Date(month.getFullYear(), month.getMonth(), day);
                  const key = keyFor(candidate);
                  const selected = key === date;
                  const isToday = key === todayKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      aria-selected={selected}
                      aria-label={dateLabel(key)}
                      onClick={() => setDate(key)}
                      className={`mx-auto grid size-8 place-items-center rounded-full text-xs transition active:scale-95 ${
                        selected
                          ? "bg-admin-ink font-semibold text-admin-surface shadow-[0_4px_12px_rgba(24,20,16,0.18)]"
                          : isToday
                            ? "font-semibold text-admin-accent ring-1 ring-inset ring-admin-accent/30 hover:bg-admin-accent/8"
                            : "text-admin-ink/70 hover:bg-admin-ink/6"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDate(todayKey);
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
                className="mt-3 text-xs font-semibold text-admin-accent hover:text-admin-ink"
              >
                Today
              </button>
            </div>
            <div className="border-t border-admin-ink/10 bg-admin-ink/[0.018] p-3 lg:border-l lg:border-t-0">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-ink/40">Time</p>
              <div className="mt-2 grid max-h-56 grid-cols-2 gap-1 overflow-y-auto pr-1 lg:grid-cols-1">
                {times.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTime(option.value)}
                    className={`min-h-8 rounded-lg px-2 text-xs font-medium transition active:scale-[0.98] ${
                      time === option.value
                        ? "bg-admin-ink text-admin-surface"
                        : "text-admin-ink/60 hover:bg-admin-ink/6"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-admin-ink/10 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setDate("");
                setTime("");
              }}
              className="text-xs font-medium text-admin-ink/45 hover:text-admin-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-9 rounded-lg bg-admin-ink px-4 text-xs font-semibold text-admin-surface transition active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
