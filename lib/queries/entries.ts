import { db } from "@/db/client";
import {
  categories,
  entries,
  projects,
  recurringRules,
  type Category,
  type Entry,
  type Project,
  type RecurringRule,
} from "@/db/schema";
import { and, desc, eq, gte, isNull, lte, type SQL } from "drizzle-orm";

export interface EntryWithRels extends Entry {
  project: Pick<Project, "id" | "name" | "slug" | "color">;
  category: Pick<Category, "id" | "name" | "color" | "kind"> | null;
}

export interface ListEntriesOptions {
  projectId?: number;
  type?: "income" | "expense";
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  limit?: number;
  /** Include entries from archived projects (default: false). */
  includeArchived?: boolean;
}

export function listEntries(opts: ListEntriesOptions = {}): EntryWithRels[] {
  const conds: SQL[] = [];
  if (opts.projectId) conds.push(eq(entries.projectId, opts.projectId));
  if (opts.type) conds.push(eq(entries.type, opts.type));
  if (opts.from) conds.push(gte(entries.occurredOn, opts.from));
  if (opts.to) conds.push(lte(entries.occurredOn, opts.to));
  // Exclude entries from archived projects unless the caller scopes to a specific
  // project (we trust that case — used by the project's own entries page) or opts in.
  if (!opts.includeArchived && !opts.projectId) {
    conds.push(isNull(projects.archivedAt));
  }

  const rows = db
    .select({
      entry: entries,
      project: {
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        color: projects.color,
      },
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
        kind: categories.kind,
      },
    })
    .from(entries)
    .innerJoin(projects, eq(entries.projectId, projects.id))
    .leftJoin(categories, eq(entries.categoryId, categories.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(entries.occurredOn), desc(entries.id))
    .limit(opts.limit ?? 500)
    .all();

  return rows.map((r) => ({
    ...r.entry,
    project: r.project,
    category: r.category && r.category.id != null ? r.category : null,
  }));
}

export function getEntryById(id: number): Entry | undefined {
  return db.select().from(entries).where(eq(entries.id, id)).get();
}

export function listAllRecurringRules(
  projectId?: number,
  opts: { includeArchived?: boolean } = {}
): RecurringRule[] {
  if (projectId) {
    return db
      .select()
      .from(recurringRules)
      .where(eq(recurringRules.projectId, projectId))
      .all();
  }
  // Filter out rules from archived projects unless asked otherwise.
  const rows = db
    .select({ rule: recurringRules })
    .from(recurringRules)
    .innerJoin(projects, eq(recurringRules.projectId, projects.id))
    .where(opts.includeArchived ? undefined : isNull(projects.archivedAt))
    .all();
  return rows.map((r) => r.rule);
}

export function getRecurringRuleById(id: number): RecurringRule | undefined {
  return db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.id, id))
    .get();
}

export function listCategories(): Category[] {
  return db.select().from(categories).orderBy(categories.sortOrder, categories.name).all();
}

export function getCategoryById(id: number): Category | undefined {
  return db.select().from(categories).where(eq(categories.id, id)).get();
}
