import { db } from "@/db/client";
import { entries, recurringRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  pendingForwardMaterializations,
  pendingMaterializations,
} from "@/lib/recurring";

/**
 * Idempotently materialize any past-due recurring entries.
 *
 * Called on every dashboard read. Uses FORWARD-ONLY semantics: only fills
 * months strictly after the latest existing entry for each rule, so manually
 * deleted entries stay deleted.
 */
export function materializeRecurring(now: Date = new Date()): number {
  const rules = db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.active, 1))
    .all();

  let inserted = 0;
  for (const rule of rules) {
    const existing = db
      .select({
        occurredOn: entries.occurredOn,
        sourceRuleId: entries.sourceRuleId,
      })
      .from(entries)
      .where(eq(entries.sourceRuleId, rule.id))
      .all();
    const pending = pendingForwardMaterializations(rule, existing, now);
    if (pending.length === 0) continue;
    db.insert(entries).values(pending).run();
    inserted += pending.length;
  }
  return inserted;
}

/**
 * FULL gap-fill for a single rule. Inserts every missing (rule, month) between
 * the rule's start and end (or today), including months where the user had
 * previously deleted the entry. Wired to the "Regenerate missing" button.
 */
export function regenerateRuleEntries(
  ruleId: number,
  now: Date = new Date()
): number {
  const rule = db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.id, ruleId))
    .get();
  if (!rule) return 0;

  const existing = db
    .select({
      occurredOn: entries.occurredOn,
      sourceRuleId: entries.sourceRuleId,
    })
    .from(entries)
    .where(eq(entries.sourceRuleId, rule.id))
    .all();

  const pending = pendingMaterializations(rule, existing, now);
  if (pending.length === 0) return 0;
  db.insert(entries).values(pending).run();
  return pending.length;
}
