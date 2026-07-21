"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { SideSheet } from "@/components/ui/side-sheet";
import { cn } from "@/lib/utils";

export type CalendarShoot = {
  id: string;
  title: string;
  startIso: string;
  packageLabel: string;
  location: string;
  stageLabel: string;
};

const TZ = "America/Toronto";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-CA", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

export function AdminCalendar({ shoots }: { shoots: CalendarShoot[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selected, setSelected] = useState<CalendarShoot | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarShoot[]>();
    for (const s of shoots) {
      const key = ymd(new Date(s.startIso));
      (map.get(key) ?? map.set(key, []).get(key)!).push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.startIso.localeCompare(b.startIso));
    return map;
  }, [shoots]);

  const days = useMemo(() => (view === "month" ? monthDays(cursor) : weekDays(cursor)), [cursor, view]);
  const monthLabel = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "long", year: "numeric" }).format(cursor);
  const todayKey = ymd(new Date());

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
          <button onClick={() => shift(-1)} aria-label="Previous" className="rounded-lg border border-admin-line p-1.5 text-admin-muted hover:bg-admin-raise">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg border border-admin-line px-3 py-1.5 text-sm text-admin-ink hover:bg-admin-raise">
            Today
          </button>
          <button onClick={() => shift(1)} aria-label="Next" className="rounded-lg border border-admin-line p-1.5 text-admin-muted hover:bg-admin-raise">
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
              className={cn("min-h-8 rounded-md px-3 text-xs font-medium capitalize", view === v ? "bg-admin-ink text-admin-surface" : "text-admin-muted")}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-admin-line bg-admin-line">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-admin-surface px-2 py-1.5 text-center text-xs font-medium text-admin-muted">{d}</div>
        ))}
        {days.map((day) => {
          const key = ymd(day);
          const inMonth = day.getMonth() === cursor.getMonth() || view === "week";
          const dayShoots = byDay.get(key) ?? [];
          return (
            <div key={key} className={cn("min-h-24 bg-admin-surface p-1.5", !inMonth && "opacity-40")}>
              <div className={cn("text-right text-xs tabular-nums", key === todayKey ? "font-bold text-admin-accent" : "text-admin-muted")}>
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayShoots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="block w-full truncate rounded bg-admin-status-info-tint px-1.5 py-0.5 text-left text-[11px] text-admin-status-info hover:opacity-80"
                  >
                    {timeLabel(s.startIso)} {s.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <SideSheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? "Shoot"}>
        {selected ? (
          <div className="space-y-4">
            <dl className="space-y-2 text-sm">
              <Row label="When" value={new Date(selected.startIso).toLocaleString("en-CA", { timeZone: TZ, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} />
              {selected.packageLabel ? <Row label="Package" value={selected.packageLabel} /> : null}
              {selected.location ? <Row label="Location" value={selected.location} /> : null}
              <Row label="Stage" value={selected.stageLabel} />
            </dl>
            <Link
              href={`/admin/bookings/${selected.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface"
            >
              Open workspace <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
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
