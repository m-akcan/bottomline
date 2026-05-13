import {
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

/** ISO YYYY-MM-DD date string (no time). */
export type IsoDate = string;
/** YYYY-MM month key, e.g. '2026-05'. */
export type MonthKey = string;

export const toIsoDate = (d: Date): IsoDate => format(d, "yyyy-MM-dd");

export const monthKey = (d: Date | IsoDate): MonthKey => {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "yyyy-MM");
};

export const monthLabel = (key: MonthKey): string => {
  if (!key || typeof key !== "string") return "";
  const parts = key.split("-").map(Number);
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return key;
  }
  const [y, m] = parts;
  const d = new Date(y, m - 1, 1);
  if (Number.isNaN(d.getTime())) return key;
  return format(d, "MMM yy");
};

export interface MonthRange {
  /** Inclusive first month, e.g. '2025-06'. */
  from: MonthKey;
  /** Inclusive last month, e.g. '2026-05'. */
  to: MonthKey;
}

export function monthsInRange(range: MonthRange): MonthKey[] {
  const out: MonthKey[] = [];
  const [fy, fm] = range.from.split("-").map(Number);
  const [ty, tm] = range.to.split("-").map(Number);
  let cursor = new Date(fy, fm - 1, 1);
  const end = new Date(ty, tm - 1, 1);
  while (cursor <= end) {
    out.push(monthKey(cursor));
    cursor = addMonths(cursor, 1);
  }
  return out;
}

export function trailingMonthRange(
  months: number,
  asOf: Date = new Date()
): MonthRange {
  const end = startOfMonth(asOf);
  const start = startOfMonth(subMonths(end, months - 1));
  return { from: monthKey(start), to: monthKey(end) };
}

export function monthBounds(key: MonthKey): {
  start: IsoDate;
  end: IsoDate;
} {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return {
    start: toIsoDate(startOfMonth(d)),
    end: toIsoDate(endOfMonth(d)),
  };
}

/** Clamp a day-of-month to the last valid day of that month (Feb 31 -> Feb 28/29). */
export function clampDayOfMonth(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month, 0).getDate(); // month here is 1-indexed; day 0 of next month = last day of this
  return Math.min(day, lastDay);
}

export { addMonths, subMonths, parseISO, format };
