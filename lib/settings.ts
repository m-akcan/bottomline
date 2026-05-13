import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AppSettings {
  baseCurrency: string;
  cashOnHandCents: number;
  fiscalYearStartMonth: number;
}

const DEFAULTS: AppSettings = {
  baseCurrency: "USD",
  cashOnHandCents: 0,
  fiscalYearStartMonth: 1,
};

export function getSettings(): AppSettings {
  const rows = db.select().from(settings).all();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    baseCurrency: map.get("base_currency") ?? DEFAULTS.baseCurrency,
    cashOnHandCents: Number(map.get("cash_on_hand_cents") ?? DEFAULTS.cashOnHandCents),
    fiscalYearStartMonth: Number(
      map.get("fiscal_year_start_month") ?? DEFAULTS.fiscalYearStartMonth
    ),
  };
}

export function setSetting(key: string, value: string) {
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ key, value }).run();
  }
}
