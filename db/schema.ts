import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6b6a2a"),
  launchedOn: text("launched_on"),
  archivedAt: text("archived_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  kind: text("kind", { enum: ["expense", "income"] })
    .notNull()
    .default("expense"),
  color: text("color").notNull().default("#a8472b"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const recurringRules = sqliteTable("recurring_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  cadence: text("cadence", { enum: ["monthly"] }).notNull().default("monthly"),
  dayOfMonth: integer("day_of_month").notNull().default(1),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on"),
  note: text("note"),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const entries = sqliteTable(
  "entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    occurredOn: text("occurred_on").notNull(),
    note: text("note"),
    sourceRuleId: integer("source_rule_id").references(
      () => recurringRules.id,
      { onDelete: "set null" }
    ),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    projectDate: index("entries_project_date").on(t.projectId, t.occurredOn),
    typeDate: index("entries_type_date").on(t.type, t.occurredOn),
    sourceRule: index("entries_source_rule").on(t.sourceRuleId),
  })
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type RecurringRule = typeof recurringRules.$inferSelect;
export type NewRecurringRule = typeof recurringRules.$inferInsert;
export type Setting = typeof settings.$inferSelect;
