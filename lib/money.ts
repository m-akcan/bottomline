/**
 * Money utilities. All amounts stored as integer minor units (cents) to avoid
 * floating-point error on aggregates. Display via Intl.NumberFormat.
 */

export const toCents = (major: number): number => Math.round(major * 100);

export const toMajor = (cents: number): number => cents / 100;

export interface FormatMoneyOptions {
  currency?: string;
  locale?: string;
  /** Show + on positive values (useful for deltas). */
  signed?: boolean;
  /** Truncate cents when amount is exact dollars. Default false. */
  compactCents?: boolean;
}

export function formatMoney(
  cents: number,
  {
    currency = "USD",
    locale = "en-US",
    signed = false,
    compactCents = false,
  }: FormatMoneyOptions = {}
): string {
  const value = toMajor(cents);
  const minimumFractionDigits =
    compactCents && Number.isInteger(value) ? 0 : 2;

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  });

  return formatter.format(value);
}

/** Compact formatting for chart axes: $1.2k, $12k, $1.4M. */
export function formatMoneyCompact(
  cents: number,
  { currency = "USD", locale = "en-US" }: FormatMoneyOptions = {}
): string {
  const value = toMajor(cents);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return formatter.format(value);
}

/** Format a percent (0.235 -> "23.5%"). */
export function formatPercent(
  fraction: number,
  { locale = "en-US", digits = 1 }: { locale?: string; digits?: number } = {}
): string {
  if (!Number.isFinite(fraction)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction);
}
