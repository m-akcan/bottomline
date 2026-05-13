"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { entries, projects, recurringRules } from "@/db/schema";
import { recurringSchema } from "@/lib/validators";
import { toCents } from "@/lib/money";
import {
  materializeRecurring,
  regenerateRuleEntries,
} from "@/lib/queries/materialize";
import {
  type ActionState,
  fromFormData,
  toFieldErrors,
} from "./_shared";

function getProjectSlug(projectId: number): string | undefined {
  return db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, projectId))
    .get()?.slug;
}

export async function createRecurringRule(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(recurringSchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  const amountCents = toCents(Number(data.amount));
  if (amountCents <= 0) {
    return { ok: false, fieldErrors: { amount: "Must be greater than zero." } };
  }
  const categoryId =
    typeof data.categoryId === "number" && data.categoryId > 0
      ? data.categoryId
      : null;

  db.insert(recurringRules)
    .values({
      projectId: data.projectId,
      type: data.type,
      amountCents,
      currency: data.currency,
      categoryId,
      cadence: "monthly",
      dayOfMonth: data.dayOfMonth,
      startsOn: data.startsOn,
      endsOn: data.endsOn || null,
      note: data.note || null,
      active: 1,
    })
    .run();

  materializeRecurring();

  const slug = getProjectSlug(data.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/recurring`);
    revalidatePath(`/projects/${slug}/entries`);
  }
  return { ok: true, message: "Recurring rule created." };
}

export async function updateRecurringRule(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(recurringSchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  const amountCents = toCents(Number(data.amount));
  if (amountCents <= 0) {
    return { ok: false, fieldErrors: { amount: "Must be greater than zero." } };
  }
  const categoryId =
    typeof data.categoryId === "number" && data.categoryId > 0
      ? data.categoryId
      : null;

  db.update(recurringRules)
    .set({
      type: data.type,
      amountCents,
      currency: data.currency,
      categoryId,
      dayOfMonth: data.dayOfMonth,
      startsOn: data.startsOn,
      endsOn: data.endsOn || null,
      note: data.note || null,
    })
    .where(eq(recurringRules.id, id))
    .run();

  // Propagate field changes to all materialized entries from this rule.
  // Date fields (occurredOn) are intentionally left alone — changing dayOfMonth
  // or the start/end window should not retroactively shift history.
  const propagated = db
    .update(entries)
    .set({
      type: data.type,
      amountCents,
      currency: data.currency,
      categoryId,
      note: data.note || null,
    })
    .where(eq(entries.sourceRuleId, id))
    .run();

  // Re-run materialization for any new months the change exposes.
  materializeRecurring();

  const slug = getProjectSlug(data.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/recurring`);
    revalidatePath(`/projects/${slug}/entries`);
  }
  const n = propagated.changes ?? 0;
  return {
    ok: true,
    message:
      n > 0
        ? `Saved. Updated ${n} past entr${n === 1 ? "y" : "ies"} to match.`
        : "Saved.",
  };
}

/**
 * Restore any materialized entries that should exist for this rule but
 * currently don't (e.g., the user deleted them manually). Idempotent —
 * running again does nothing if everything is already filled in.
 */
export async function regenerateRecurringEntries(
  ruleId: number
): Promise<void> {
  const rule = db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.id, ruleId))
    .get();
  if (!rule) return;

  regenerateRuleEntries(ruleId);

  const slug = getProjectSlug(rule.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/recurring`);
    revalidatePath(`/projects/${slug}/entries`);
  }
}

export async function toggleRecurringRule(id: number, active: boolean): Promise<void> {
  const rule = db.select().from(recurringRules).where(eq(recurringRules.id, id)).get();
  if (!rule) return;
  db.update(recurringRules)
    .set({ active: active ? 1 : 0 })
    .where(eq(recurringRules.id, id))
    .run();
  const slug = getProjectSlug(rule.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/recurring`);
  }
}

export async function deleteRecurringRule(id: number): Promise<void> {
  const rule = db.select().from(recurringRules).where(eq(recurringRules.id, id)).get();
  if (!rule) return;
  db.delete(recurringRules).where(eq(recurringRules.id, id)).run();
  const slug = getProjectSlug(rule.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/recurring`);
  }
}

export async function runMaterialization(): Promise<{ inserted: number }> {
  const inserted = materializeRecurring();
  revalidatePath("/");
  return { inserted };
}
