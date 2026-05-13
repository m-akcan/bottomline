import type { Entry, RecurringRule } from "@/db/schema";
import { convert } from "./fx";
import {
  monthKey,
  monthsInRange,
  parseISO,
  type MonthKey,
  type MonthRange,
} from "./date";

export interface MonthlyBucket {
  month: MonthKey;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

export interface CategorySlice {
  categoryId: number | null;
  totalCents: number;
  fraction: number;
}

export interface LifetimeTotals {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  entryCount: number;
}

type MoneyEntry = Pick<
  Entry,
  "type" | "amountCents" | "currency" | "occurredOn" | "categoryId"
>;

function toBase(amountCents: number, currency: string, baseCurrency: string) {
  return convert(amountCents, currency, baseCurrency);
}

/**
 * Bucket entries into months over the given range, converted to a base currency.
 * Months with no activity are present with zero values.
 */
export function monthlySeries(
  entries: MoneyEntry[],
  range: MonthRange,
  baseCurrency = "USD"
): MonthlyBucket[] {
  const buckets = new Map<MonthKey, MonthlyBucket>();
  for (const mk of monthsInRange(range)) {
    buckets.set(mk, {
      month: mk,
      incomeCents: 0,
      expenseCents: 0,
      netCents: 0,
    });
  }
  for (const e of entries) {
    const mk = monthKey(parseISO(e.occurredOn));
    const bucket = buckets.get(mk);
    if (!bucket) continue;
    const cents = toBase(e.amountCents, e.currency, baseCurrency);
    if (e.type === "income") bucket.incomeCents += cents;
    else bucket.expenseCents += cents;
    bucket.netCents = bucket.incomeCents - bucket.expenseCents;
  }
  return [...buckets.values()];
}

/** Sum of all currently-active recurring income rules, in base currency. */
export function mrrFromRules(
  rules: RecurringRule[],
  baseCurrency = "USD",
  asOf: Date = new Date()
): number {
  const today = monthKey(asOf);
  return rules
    .filter((r) => r.active && r.type === "income")
    .filter((r) => monthKey(r.startsOn) <= today)
    .filter((r) => !r.endsOn || monthKey(r.endsOn) >= today)
    .reduce((sum, r) => sum + toBase(r.amountCents, r.currency, baseCurrency), 0);
}

/** Fallback MRR: last full calendar month's income. */
export function mrrFallback(
  entries: MoneyEntry[],
  baseCurrency = "USD",
  asOf: Date = new Date()
): number {
  // last full month = the month before the one containing `asOf`
  const ref = new Date(asOf.getFullYear(), asOf.getMonth() - 1, 1);
  const lastFull = monthKey(ref);
  return entries
    .filter((e) => e.type === "income" && monthKey(parseISO(e.occurredOn)) === lastFull)
    .reduce((sum, e) => sum + toBase(e.amountCents, e.currency, baseCurrency), 0);
}

/** Average monthly gross expense over the trailing N months. */
export function burnRate(
  entries: MoneyEntry[],
  months = 3,
  baseCurrency = "USD",
  asOf: Date = new Date()
): number {
  const monthsList: MonthKey[] = [];
  for (let i = 1; i <= months; i++) {
    const d = new Date(asOf.getFullYear(), asOf.getMonth() - i, 1);
    monthsList.push(monthKey(d));
  }
  const total = entries
    .filter((e) => e.type === "expense")
    .filter((e) => monthsList.includes(monthKey(parseISO(e.occurredOn))))
    .reduce((sum, e) => sum + toBase(e.amountCents, e.currency, baseCurrency), 0);
  return Math.round(total / months);
}

/**
 * Net burn = average monthly (expenses − income) over the trailing N months.
 * Negative values mean the business is profitable on average. This is the
 * industry-standard input to runway.
 */
export function netBurnRate(
  entries: MoneyEntry[],
  months = 3,
  baseCurrency = "USD",
  asOf: Date = new Date()
): number {
  const monthsList: MonthKey[] = [];
  for (let i = 1; i <= months; i++) {
    const d = new Date(asOf.getFullYear(), asOf.getMonth() - i, 1);
    monthsList.push(monthKey(d));
  }
  const total = entries
    .filter((e) => monthsList.includes(monthKey(parseISO(e.occurredOn))))
    .reduce((sum, e) => {
      const cents = toBase(e.amountCents, e.currency, baseCurrency);
      return sum + (e.type === "expense" ? cents : -cents);
    }, 0);
  return Math.round(total / months);
}

/** Months until cash on hand is exhausted at the given burn. Returns Infinity if no burn. */
export function runwayMonths(
  cashOnHandCents: number,
  burnCentsPerMonth: number
): number {
  if (burnCentsPerMonth <= 0) return Infinity;
  if (cashOnHandCents <= 0) return 0;
  return cashOnHandCents / burnCentsPerMonth;
}

/** First future-trending month index where cumulative net flips positive, or null. */
export function monthsToProfitability(series: MonthlyBucket[]): number | null {
  let cumulative = 0;
  for (let i = 0; i < series.length; i++) {
    cumulative += series[i].netCents;
    if (cumulative >= 0) return i;
  }
  return null;
}

export function categoryBreakdown(
  entries: MoneyEntry[],
  baseCurrency = "USD",
  type: "expense" | "income" = "expense"
): CategorySlice[] {
  const sums = new Map<number | null, number>();
  let total = 0;
  for (const e of entries) {
    if (e.type !== type) continue;
    const cents = toBase(e.amountCents, e.currency, baseCurrency);
    sums.set(e.categoryId ?? null, (sums.get(e.categoryId ?? null) ?? 0) + cents);
    total += cents;
  }
  return [...sums.entries()]
    .map(([categoryId, totalCents]) => ({
      categoryId,
      totalCents,
      fraction: total > 0 ? totalCents / total : 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export function lifetimeTotals(
  entries: MoneyEntry[],
  baseCurrency = "USD"
): LifetimeTotals {
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    const cents = toBase(e.amountCents, e.currency, baseCurrency);
    if (e.type === "income") income += cents;
    else expense += cents;
  }
  return {
    incomeCents: income,
    expenseCents: expense,
    netCents: income - expense,
    entryCount: entries.length,
  };
}

/** Year-to-date net profit, in base currency. */
export function ytdNet(
  entries: MoneyEntry[],
  baseCurrency = "USD",
  asOf: Date = new Date()
): number {
  const year = asOf.getFullYear();
  let net = 0;
  for (const e of entries) {
    if (parseISO(e.occurredOn).getFullYear() !== year) continue;
    const cents = toBase(e.amountCents, e.currency, baseCurrency);
    net += e.type === "income" ? cents : -cents;
  }
  return net;
}
