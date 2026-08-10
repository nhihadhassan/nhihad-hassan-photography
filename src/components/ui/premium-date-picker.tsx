"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

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

function dateLabel(value: string, placeholder: string) {
  if (!value) return placeholder;
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function timeLabel(value: string) {
  if (!value) return "Choose time";
  const preset = times.find((time) => time.value === value);
  if (preset) return preset.label;
  // Fall back to formatting odd (non-30-minute) values, e.g. a stored 23:59.
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  return new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2026, 0, 1, hours, minutes),
  );
}

/**
 * Premium calendar-popover date picker matching the visual language of
 * PremiumDateTimePicker, but emitting a single hidden `name` field so it
 * drops into existing forms/server actions unchanged: "YYYY-MM-DD" alone,
 * or "YYYY-MM-DDTHH:MM" (same shape a native datetime-local input already
 * produces) when `includeTime` is set.
 */
export function PremiumDatePicker({
  label,
  name,
  defaultValue,
  placeholder = "Choose date",
  includeTime = false,
  helperText,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  includeTime?: boolean;
  helperText?: string;
}) {
  const initialDate = defaultValue ? defaultValue.slice(0, 10) : "";
  const initialTime = includeTime && defaultValue && defaultValue.length > 10 ? defaultValue.slice(11, 16) : "";

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const base = initialDate ? new Date(`${initialDate}T12:00:00`) : new Date(`${torontoTodayKey()}T12:00:00`);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const todayKey = torontoTodayKey();
  const today = new Date(`${todayKey}T12:00:00`);
  const monthLabel = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(month);
  const firstDay = month.getDay();
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const combinedValue = date ? (includeTime ? `${date}T${time || "00:00"}` : date) : "";

  return (
    <div ref={containerRef} className="relative grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={combinedValue} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2.5 rounded-md border border-admin-ink/10 bg-white/70 px-3 text-left text-sm outline-none transition hover:border-admin-ink/25 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35"
      >
        <CalendarDays className="size-4 shrink-0 text-admin-accent" aria-hidden="true" />
        <span className={date ? "text-admin-ink" : "text-admin-ink/60"}>
          {dateLabel(date, placeholder)}
          {includeTime && date ? ` · ${timeLabel(time)}` : ""}
        </span>
      </button>
      {helperText ? <span className="text-xs text-admin-ink/65">{helperText}</span> : null}

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-admin-ink/12 bg-white/95 shadow-[0_18px_45px_rgba(43,35,28,0.14)]">
          <div className={includeTime ? "grid sm:grid-cols-[minmax(0,1fr)_11rem]" : ""}>
            <div className="w-72 p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                  className="grid size-8 place-items-center rounded-full text-admin-ink/55 transition hover:bg-admin-ink/6 active:scale-95"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <span className="text-sm font-semibold">{monthLabel}</span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                  className="grid size-8 place-items-center rounded-full text-admin-ink/55 transition hover:bg-admin-ink/6 active:scale-95"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-admin-ink/35">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span key={`${day}-${index}`} className="py-2">
                    {day}
                  </span>
                ))}
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
                      aria-label={dateLabel(key, placeholder)}
                      onClick={() => {
                        setDate(key);
                        if (!includeTime) setOpen(false);
                      }}
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
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDate(todayKey);
                    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    if (!includeTime) setOpen(false);
                  }}
                  className="text-xs font-semibold text-admin-accent hover:text-admin-ink"
                >
                  Today
                </button>
                {date ? (
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
                ) : null}
              </div>
            </div>
            {includeTime ? (
              <div className="border-t border-admin-ink/10 bg-admin-ink/[0.018] p-3 sm:border-l sm:border-t-0">
                <p className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-ink/40">
                  <Clock3 className="size-3" aria-hidden="true" />
                  Time
                </p>
                <div className="mt-2 grid max-h-56 grid-cols-2 gap-1 overflow-y-auto pr-1 sm:grid-cols-1">
                  {times.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTime(option.value)}
                      className={`min-h-8 rounded-lg px-2 text-xs font-medium transition active:scale-[0.98] ${
                        time === option.value ? "bg-admin-ink text-admin-surface" : "text-admin-ink/60 hover:bg-admin-ink/6"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 min-h-8 w-full rounded-lg bg-admin-ink text-xs font-semibold text-admin-surface transition active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
