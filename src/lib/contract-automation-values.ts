import type { AgreementDetails } from "@/lib/agreements";

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseContractDate(value: string | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const long = text.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!long) return null;
  const month = MONTHS[long[1].toLocaleLowerCase("en-CA")];
  if (!month) return null;
  return `${long[3]}-${pad(month)}-${pad(Number(long[2]))}`;
}

export function parseContractTime(value: string | undefined): string | null {
  const text = value?.trim().toLocaleUpperCase("en-CA");
  if (!text) return null;
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour < 1 || hour > 12 || minute > 59) return null;
  if (match[3] === "AM" && hour === 12) hour = 0;
  if (match[3] === "PM" && hour !== 12) hour += 12;
  return `${pad(hour)}:${pad(minute)}`;
}

export function parseCoverageMinutes(value: string | undefined): number | null {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(/^(minutes?|mins?)/i.test(match[2]) ? amount : amount * 60);
}

export function parseContractMoney(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function addBusinessDays(date: string, businessDays: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day, 12));
  let counted = 0;
  while (counted < businessDays) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) counted += 1;
  }
  return `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`;
}

export type ContractAutomationValues = {
  shootDate: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  total: number;
  invoiceDueDate: string;
  turnaroundBusinessDays: number;
  deliveryDueDate: string;
};

export function contractAutomationValues(details: AgreementDetails):
  | { ok: true; values: ContractAutomationValues }
  | { ok: false; missing: string[] } {
  const shootDate = parseContractDate(details.date);
  const startTime = parseContractTime(details.startTime);
  const durationMinutes = parseCoverageMinutes(details.coverageTime);
  const total = parseContractMoney(details.total);
  const invoiceDueDate = parseContractDate(details.balanceDueDate);
  const turnaroundBusinessDays = Number(details.turnaroundBusinessDays);
  const location = details.location?.trim() || null;
  const missing: string[] = [];
  if (!shootDate) missing.push("shoot date");
  if (!startTime) missing.push("start time with AM or PM");
  if (!durationMinutes) missing.push("coverage duration");
  if (!location) missing.push("location");
  if (total === null || total <= 0) missing.push("total fee");
  if (!invoiceDueDate) missing.push("balance due date");
  if (!Number.isInteger(turnaroundBusinessDays) || turnaroundBusinessDays <= 0) missing.push("turnaround business days");
  if (missing.length || !shootDate || !startTime || !durationMinutes || !location || total === null || !invoiceDueDate) {
    return { ok: false, missing };
  }
  return {
    ok: true,
    values: {
      shootDate,
      startTime,
      durationMinutes,
      location,
      total,
      invoiceDueDate,
      turnaroundBusinessDays,
      deliveryDueDate: addBusinessDays(shootDate, turnaroundBusinessDays),
    },
  };
}
