import { subDays, subHours } from "date-fns";

const now = new Date("2026-08-04T12:00:00.000Z");

export function isoDaysAgo(days: number) {
  return subDays(now, days).toISOString();
}

export function isoHoursAgo(hours: number) {
  return subHours(now, hours).toISOString();
}

export function isoNow() {
  return now.toISOString();
}

