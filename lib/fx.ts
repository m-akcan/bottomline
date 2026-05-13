/**
 * Static FX rate table. v1: edit by hand. v2 TODO: pull from open.er-api.com
 * with a 24h cache. Rates expressed relative to USD.
 */

const RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  CHF: 1.12,
  JPY: 0.0067,
  INR: 0.012,
  BRL: 0.18,
  TRY: 0.029,
  MXN: 0.058,
  SGD: 0.74,
  ZAR: 0.054,
};

export const SUPPORTED_CURRENCIES = Object.keys(RATES_TO_USD);

/** Convert an amount in cents from one ISO currency to another. */
export function convert(
  amountCents: number,
  from: string,
  to: string
): number {
  if (from === to) return amountCents;
  const fromRate = RATES_TO_USD[from];
  const toRate = RATES_TO_USD[to];
  if (!fromRate || !toRate) {
    // Unknown currency — pass-through, log in dev.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[fx] missing rate for ${from} or ${to}, passing through`);
    }
    return amountCents;
  }
  return Math.round((amountCents * fromRate) / toRate);
}
