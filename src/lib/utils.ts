import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse a free-form money string ("$1,400", "1400") to a number, or null. */
export function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Format a number as Canadian dollars with no cents (e.g. "$1,400"). */
export function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-CA")}`;
}

export function formatDisplayDate(date: string) {
  const value = date.includes("T") ? new Date(date) : new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function formatCoverDate(date: string) {
  const value = date.includes("T") ? new Date(date) : new Date(`${date}T12:00:00`);
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(value);
  const day = value.getDate();
  const year = value.getFullYear();
  const rem10 = day % 10;
  const rem100 = day % 100;
  const suffix =
    rem10 === 1 && rem100 !== 11
      ? "st"
      : rem10 === 2 && rem100 !== 12
        ? "nd"
        : rem10 === 3 && rem100 !== 13
          ? "rd"
          : "th";
  return `${month} ${day}${suffix} ${year}`;
}

export function formatCompactDate(date: string | null) {
  if (!date) {
    return "No date";
  }

  const value = date.includes("T") ? new Date(date) : new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

/**
 * Admin list date rule: relative within 7 days ("3 days ago", "in 2 days"),
 * absolute beyond. Accepts a date-only or ISO string.
 */
export function formatRelativeDate(date: string | null): string {
  if (!date) return "No date";
  const value = date.includes("T") ? new Date(date) : new Date(`${date}T12:00:00`);
  const ms = value.getTime();
  if (!Number.isFinite(ms)) return "No date";
  const diff = ms - Date.now();
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  if (Math.abs(days) <= 7) {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
  }
  return formatCompactDate(date);
}

/** Compact "how long" label from a past timestamp, for attention/age markers. */
export function formatAge(from: string | null): string {
  if (!from) return "";
  const start = new Date(from).getTime();
  if (!Number.isFinite(start)) return "";
  const mins = Math.floor((Date.now() - start) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Strip characters invalid in Windows/macOS filenames; collapse whitespace. */
export function sanitizeFilename(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
