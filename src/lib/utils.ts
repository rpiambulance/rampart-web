import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TZ } from "./format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Determines if a datestamp from the db (2026-10-26T00:00:00.000Z) is before today in America/New_York.
export function isBeforeToday(date: string): boolean {
  const inputDate = new Date(date);
  const inputDay = Date.UTC(
    inputDate.getUTCFullYear(),
    inputDate.getUTCMonth(),
    inputDate.getUTCDate(),
  );
  const todayInNewYork = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(todayInNewYork.find((item) => item.type === type)?.value);
  const today = Date.UTC(part("year"), part("month") - 1, part("day"));

  return inputDay < today;
}