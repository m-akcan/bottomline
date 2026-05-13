import { db, sqlite } from "./client";
import {
  categories,
  entries,
  projects,
  recurringRules,
  settings,
} from "./schema";
import { addMonths, format } from "date-fns";

console.log("[seed] starting");

// Wipe in dependency order.
db.delete(entries).run();
db.delete(recurringRules).run();
db.delete(projects).run();
db.delete(categories).run();
db.delete(settings).run();

// Settings
db.insert(settings).values([
  { key: "base_currency", value: "USD" },
  { key: "cash_on_hand_cents", value: "1250000" }, // $12,500
  { key: "fiscal_year_start_month", value: "1" },
]).run();

// Categories
const insertedCats = db
  .insert(categories)
  .values([
    { name: "Hosting", kind: "expense", color: "#a8472b", sortOrder: 0 },
    { name: "Domain", kind: "expense", color: "#b8854a", sortOrder: 1 },
    { name: "API", kind: "expense", color: "#6b6a2a", sortOrder: 2 },
    { name: "Stripe fees", kind: "expense", color: "#7a5a8a", sortOrder: 3 },
    { name: "Tooling", kind: "expense", color: "#5a8a7a", sortOrder: 4 },
    { name: "Marketing", kind: "expense", color: "#8a5a6a", sortOrder: 5 },
    { name: "Email", kind: "expense", color: "#8a7a4a", sortOrder: 6 },
    { name: "Subscriptions", kind: "expense", color: "#4a7a8a", sortOrder: 7 },
  ])
  .returning()
  .all();
const catByName = new Map(insertedCats.map((c) => [c.name, c.id]));

// Projects
const insertedProjects = db
  .insert(projects)
  .values([
    {
      slug: "helios",
      name: "Helios Analytics",
      description: "Lightweight web analytics for indie devs.",
      color: "#6b6a2a",
      launchedOn: "2025-01-15",
    },
    {
      slug: "pingbox",
      name: "Pingbox",
      description: "Uptime monitoring with SMS alerts.",
      color: "#a8472b",
      launchedOn: "2024-08-01",
    },
  ])
  .returning()
  .all();

const helios = insertedProjects.find((p) => p.slug === "helios")!;
const pingbox = insertedProjects.find((p) => p.slug === "pingbox")!;

// Recurring rules
const insertedRules = db
  .insert(recurringRules)
  .values([
    {
      projectId: helios.id,
      type: "expense",
      amountCents: 2000, // $20 hosting
      currency: "USD",
      categoryId: catByName.get("Hosting")!,
      cadence: "monthly",
      dayOfMonth: 1,
      startsOn: "2025-01-01",
      note: "Fly.io hosting",
      active: 1,
    },
    {
      projectId: pingbox.id,
      type: "expense",
      amountCents: 1200, // $12 hosting
      currency: "USD",
      categoryId: catByName.get("Hosting")!,
      cadence: "monthly",
      dayOfMonth: 1,
      startsOn: "2024-08-01",
      note: "Render starter",
      active: 1,
    },
  ])
  .returning()
  .all();

// Ad-hoc entries — generate ~12 months of activity per project
const now = new Date(2026, 4, 13); // 2026-05-13
type SeedEntry = {
  projectId: number;
  type: "income" | "expense";
  amountCents: number;
  currency: string;
  categoryId: number | null;
  occurredOn: string;
  note: string | null;
  sourceRuleId: number | null;
};
const seedEntries: SeedEntry[] = [];

function dayOf(monthOffset: number, day = 5): string {
  const d = addMonths(now, -monthOffset);
  return format(new Date(d.getFullYear(), d.getMonth(), day), "yyyy-MM-dd");
}

// Helios: revenue ramps, plus occasional expenses
for (let i = 12; i >= 0; i--) {
  const baseRev = 800 + (12 - i) * 220 + Math.floor(Math.random() * 200);
  seedEntries.push({
    projectId: helios.id,
    type: "income",
    amountCents: baseRev * 100,
    currency: "USD",
    categoryId: null,
    occurredOn: dayOf(i, 28),
    note: "Stripe payout",
    sourceRuleId: null,
  });
  // Stripe fees
  seedEntries.push({
    projectId: helios.id,
    type: "expense",
    amountCents: Math.round(baseRev * 0.029 * 100),
    currency: "USD",
    categoryId: catByName.get("Stripe fees")!,
    occurredOn: dayOf(i, 28),
    note: "Stripe processing",
    sourceRuleId: null,
  });
  if (i % 3 === 0) {
    seedEntries.push({
      projectId: helios.id,
      type: "expense",
      amountCents: 4900,
      currency: "USD",
      categoryId: catByName.get("API")!,
      occurredOn: dayOf(i, 10),
      note: "Resend",
      sourceRuleId: null,
    });
  }
}

// Pingbox: steadier, smaller revenue
for (let i = 12; i >= 0; i--) {
  const baseRev = 350 + Math.floor(Math.random() * 80);
  seedEntries.push({
    projectId: pingbox.id,
    type: "income",
    amountCents: baseRev * 100,
    currency: "USD",
    categoryId: null,
    occurredOn: dayOf(i, 25),
    note: "Stripe payout",
    sourceRuleId: null,
  });
  if (i === 6) {
    seedEntries.push({
      projectId: pingbox.id,
      type: "expense",
      amountCents: 1800,
      currency: "USD",
      categoryId: catByName.get("Domain")!,
      occurredOn: dayOf(6, 12),
      note: "Domain renewal",
      sourceRuleId: null,
    });
  }
  if (i % 2 === 0) {
    seedEntries.push({
      projectId: pingbox.id,
      type: "expense",
      amountCents: 2900,
      currency: "USD",
      categoryId: catByName.get("Marketing")!,
      occurredOn: dayOf(i, 14),
      note: "Twitter ads",
      sourceRuleId: null,
    });
  }
}

// Materialize recurring rules historically by hand here for the seed
for (const rule of insertedRules) {
  const start = new Date(rule.startsOn);
  let cursor = new Date(start.getFullYear(), start.getMonth(), rule.dayOfMonth);
  while (cursor <= now) {
    seedEntries.push({
      projectId: rule.projectId,
      type: rule.type,
      amountCents: rule.amountCents,
      currency: rule.currency,
      categoryId: rule.categoryId,
      occurredOn: format(cursor, "yyyy-MM-dd"),
      note: rule.note,
      sourceRuleId: rule.id,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, rule.dayOfMonth);
  }
}

db.insert(entries).values(seedEntries).run();

console.log(
  `[seed] done — projects=${insertedProjects.length}, categories=${insertedCats.length}, rules=${insertedRules.length}, entries=${seedEntries.length}`
);

sqlite.close();
