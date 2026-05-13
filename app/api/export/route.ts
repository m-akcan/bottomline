import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  categories,
  entries,
  projects,
  recurringRules,
  settings,
} from "@/db/schema";

/**
 * Full DB snapshot as JSON. Stable shape:
 *
 *   { version, exportedAt, projects, categories, recurring_rules, entries, settings }
 *
 * The matching POST import accepts the same shape and replaces the DB.
 */
export const EXPORT_VERSION = 1;

export async function GET() {
  const payload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    projects: db.select().from(projects).all(),
    categories: db.select().from(categories).all(),
    recurring_rules: db.select().from(recurringRules).all(),
    entries: db.select().from(entries).all(),
    settings: db.select().from(settings).all(),
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `bottomline-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
