import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
