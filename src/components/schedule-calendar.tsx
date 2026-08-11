"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { SideSheet } from "@/components/ui/side-sheet";
import { cn } from "@/lib/utils";

export type ScheduleEvent = {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  location: string | null;
  tentative: boolean;
  /** A booking whose shoot date lands on the same day as this calendar event, if one exists. */
  bookingId: string | null;
  bookingStageLabel: string | null;
};

const TZ = "America/Toronto";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-CA", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

export function ScheduleCalendar({ events }: { events: ScheduleEvent[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const key = ymd(new Date(e.startIso));
      (map.get(key) ?? map.set(key, []).get(key)!).push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.startIso.localeCompare(b.startIso));
    return map;
  }, [events]);

  const days = useMemo(() => (view === "month" ? monthDays(cursor) : weekDays(cursor)), [cursor, view]);
  const monthLabel = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "long", year: "numeric" }).format(cursor);
  const todayKey = ymd(new Date());
  const mobileDays = days
    .map((day) => ({ day, key: ymd(day), events: byDay.get(ymd(day)) ?? [] }))
    .filter(({ day, events }) => (view === "week" || day.getMonth() === cursor.getMonth()) && events.length > 0);

  function shift(dir: number) {
    setCursor((c) => {
      const next = new Date(c);
      if (view === "month") next.setMonth(next.getMonth() + dir);
      else next.setDate(next.getDate() + dir * 7);
      return next;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} aria-label="Previous" className="inline-flex size-11 items-center justify-center rounded-lg border border-admin-line text-admin-muted hover:bg-admin-raise sm:size-9">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button onClick={() => setCursor(new Date())} className="min-h-11 rounded-lg border border-admin-line px-3 py-1.5 text-sm text-admin-ink hover:bg-admin-raise sm:min-h-9">
            Today
          </button>
          <button onClick={() => shift(1)} aria-label="Next" className="inline-flex size-11 items-center justify-center rounded-lg border border-admin-line text-admin-muted hover:bg-admin-raise sm:size-9">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <span className="admin-display ml-1 text-lg text-admin-ink">{monthLabel}</span>
        </div>
        <div className="inline-flex rounded-lg border border-admin-line p-0.5">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn("min-h-11 rounded-md px-3 text-xs font-medium capitalize sm:min-h-8", view === v ? "bg-admin-ink text-admin-surface" : "text-admin-muted")}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-admin-line bg-admin-surface md:hidden">
        {mobileDays.length > 0 ? (
          <div className="divide-y divide-admin-line">
            {mobileDays.map(({ day, key, events: dayEvents }) => (
              <section key={key} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className={cn("text-sm font-semibold", key === todayKey ? "text-admin-accent" : "text-admin-ink")}>
                    {new Intl.DateTimeFormat("en-CA", { timeZone: TZ, weekday: "long", month: "short", day: "numeric" }).format(day)}
                  </h2>
                  {key === todayKey ? <span className="text-xs font-medium text-admin-accent">Today</span> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelected(event)}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left",
                        event.tentative
                          ? "bg-admin-status-waiting-tint text-admin-status-waiting"
                          : "bg-admin-status-info-tint text-admin-status-info",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{event.title}</span>
                      <span className="shrink-0 text-xs tabular-nums">{event.allDay ? "All day" : timeLabel(event.startIso)}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-admin-ink">No events in this {view}.</p>
            <p className="mt-1 text-sm text-admin-muted">Use the arrows to check another date.</p>
          </div>
        )}
      </div>

      <div className="mt-4 hidden grid-cols-7 gap-px overflow-hidden rounded-xl border border-admin-line bg-admin-line md:grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-admin-surface px-2 py-1.5 text-center text-xs font-medium text-admin-muted">{d}</div>
        ))}
        {days.map((day) => {
          const key = ymd(day);
          const inMonth = day.getMonth() === cursor.getMonth() || view === "week";
          const dayEvents = byDay.get(key) ?? [];
          return (
            <div key={key} className={cn("min-h-24 bg-admin-surface p-1.5", !inMonth && "opacity-40")}>
              <div className={cn("text-right text-xs tabular-nums", key === todayKey ? "font-bold text-admin-accent" : "text-admin-muted")}>
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className={cn(
                      "block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] hover:opacity-80",
                      e.tentative
                        ? "bg-admin-status-waiting-tint text-admin-status-waiting"
                        : "bg-admin-status-info-tint text-admin-status-info",
                    )}
                  >
                    {e.allDay ? "All day" : timeLabel(e.startIso)} {e.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <SideSheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? "Event"}>
        {selected ? (
          <div className="space-y-4">
            <dl className="space-y-2 text-sm">
              <Row
                label="When"
                value={
                  selected.allDay
                    ? new Date(selected.startIso).toLocaleDateString("en-CA", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" })
                    : new Date(selected.startIso).toLocaleString("en-CA", { timeZone: TZ, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })
                }
              />
              {selected.location ? <Row label="Location" value={selected.location} /> : null}
              <Row label="Status" value={selected.tentative ? "Tentative" : "Confirmed"} />
              {selected.bookingStageLabel ? <Row label="Booking stage" value={selected.bookingStageLabel} /> : null}
            </dl>
            {selected.bookingId ? (
              <Link
                href={`/admin/bookings/${selected.bookingId}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface"
              >
                Open booking <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/admin/bookings/new"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-line px-4 text-sm font-medium text-admin-ink hover:bg-admin-raise"
              >
                <Plus className="size-4" aria-hidden="true" />
                Create a booking for this
              </Link>
            )}
          </div>
        ) : null}
      </SideSheet>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-admin-muted">{label}</dt>
      <dd className="text-right text-admin-ink">{value}</dd>
    </div>
  );
}

/** Days for a month grid, padded to full weeks (Sun start). */
function monthDays(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const out: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}

/** The seven days of the week containing the cursor (Sun start). */
function weekDays(cursor: Date): Date[] {
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - cursor.getDay());
  const out: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}
