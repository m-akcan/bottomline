"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db, sqlite } from "@/db/client";
import {
  categories,
  entries,
  projects,
  recurringRules,
  settings,
} from "@/db/schema";
import { type ActionState } from "./_shared";

const isoDateTime = z.string().min(1);
const isoDate = z.string().min(1);
const hex = z.string();
const nullableNumber = z.number().int().nullable().optional();
const nullableString = z.string().nullable().optional();

const projectRow = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: nullableString,
  color: hex,
  launchedOn: nullableString,
  archivedAt: nullableString,
  createdAt: isoDateTime,
});

const categoryRow = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  kind: z.enum(["expense", "income"]),
  color: hex,
  sortOrder: z.number().int(),
});

const recurringRow = z.object({
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
  type: z.enum(["income", "expense"]),
  amountCents: z.number().int(),
  currency: z.string().min(1),
  categoryId: nullableNumber,
  cadence: z.enum(["monthly"]),
  dayOfMonth: z.number().int().min(1).max(31),
  startsOn: isoDate,
  endsOn: nullableString,
  note: nullableString,
  active: z.number().int().min(0).max(1),
  createdAt: isoDateTime,
});

const entryRow = z.object({
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
  type: z.enum(["income", "expense"]),
  amountCents: z.number().int(),
  currency: z.string().min(1),
  categoryId: nullableNumber,
  occurredOn: isoDate,
  note: nullableString,
  sourceRuleId: nullableNumber,
  createdAt: isoDateTime,
});

const settingRow = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const importSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  projects: z.array(projectRow),
  categories: z.array(categoryRow),
  recurring_rules: z.array(recurringRow),
  entries: z.array(entryRow),
  settings: z.array(settingRow),
});

function bumpSequence(table: string) {
  // After inserting explicit AUTOINCREMENT ids, make sure sqlite_sequence
  // reflects the new high-watermark so the next auto insert doesn't collide.
  sqlite
    .prepare(
      `INSERT INTO sqlite_sequence(name, seq)
       SELECT ?, IFNULL((SELECT MAX(id) FROM ${table}), 0)
       WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = ?)`
    )
    .run(table, table);
  sqlite
    .prepare(
      `UPDATE sqlite_sequence
       SET seq = MAX(seq, IFNULL((SELECT MAX(id) FROM ${table}), 0))
       WHERE name = ?`
    )
    .run(table);
}

export async function importData(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No file selected." };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, message: "File is too large (max 50 MB)." };
  }

  let json: unknown;
  try {
    const text = await file.text();
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: "File is not valid JSON." };
  }

  const parsed = importSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") || "root";
    return {
      ok: false,
      message: `Invalid export file at "${path}": ${first?.message ?? "unknown"}.`,
    };
  }

  const data = parsed.data;

  try {
    sqlite.transaction(() => {
      // Delete in FK dependency order (most dependent first).
      db.delete(entries).run();
      db.delete(recurringRules).run();
      db.delete(projects).run();
      db.delete(categories).run();
      db.delete(settings).run();

      // Insert in reverse order, preserving original IDs so FKs stay valid.
      if (data.settings.length) {
        db.insert(settings).values(data.settings).run();
      }
      if (data.categories.length) {
        db.insert(categories).values(data.categories).run();
      }
      if (data.projects.length) {
        db.insert(projects).values(data.projects).run();
      }
      if (data.recurring_rules.length) {
        db.insert(recurringRules).values(data.recurring_rules).run();
      }
      if (data.entries.length) {
        db.insert(entries).values(data.entries).run();
      }

      bumpSequence("projects");
      bumpSequence("categories");
      bumpSequence("recurring_rules");
      bumpSequence("entries");
    })();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, message: `Import failed: ${msg}` };
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    message: `Imported ${data.projects.length} project${
      data.projects.length === 1 ? "" : "s"
    }, ${data.entries.length} entr${
      data.entries.length === 1 ? "y" : "ies"
    }, ${data.recurring_rules.length} recurring rule${
      data.recurring_rules.length === 1 ? "" : "s"
    }.`,
  };
}
