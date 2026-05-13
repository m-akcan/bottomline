"use client";

import { useActionState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import {
  createRecurringRule,
  updateRecurringRule,
} from "@/lib/actions/recurring";
import type { ActionState } from "@/lib/actions/_shared";
import type { Category, Project, RecurringRule } from "@/db/schema";

const initial: ActionState = { ok: false };

export interface RecurringFormProps {
  project: Project;
  categories: Category[];
  baseCurrency: string;
  /** When provided, the form edits this rule instead of creating a new one. */
  rule?: RecurringRule;
}

export function RecurringForm({
  project,
  categories,
  baseCurrency,
  rule,
}: RecurringFormProps) {
  const action = rule
    ? updateRecurringRule.bind(null, rule.id)
    : createRecurringRule;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-xl">
      <input type="hidden" name="projectId" value={project.id} />

      {state.message && (
        <p
          className={`text-sm border rounded-[4px] px-3 py-2 ${
            state.ok
              ? "text-gain bg-gain-tint border-gain-soft"
              : "text-loss bg-loss-tint border-loss-soft"
          }`}
        >
          {state.message}
        </p>
      )}

      <Field label="Kind">
        <SegmentedControl
          name="type"
          defaultValue={rule?.type ?? "expense"}
          options={[
            { value: "expense", label: "Expense", tone: "loss" },
            { value: "income", label: "Income", tone: "gain" },
          ]}
        />
      </Field>

      <Field
        label="Amount"
        required
        error={state.fieldErrors?.amount}
        htmlFor="rec-amount"
      >
        <CurrencyInput
          id="rec-amount"
          name="amount"
          defaultAmount={rule ? rule.amountCents / 100 : undefined}
          defaultCurrency={rule?.currency ?? baseCurrency}
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Day of month" hint="1–28" htmlFor="rec-dom">
          <Input
            id="rec-dom"
            name="dayOfMonth"
            type="number"
            min={1}
            max={28}
            defaultValue={rule?.dayOfMonth ?? 1}
          />
        </Field>
        <Field label="Category" htmlFor="rec-cat">
          <Select
            id="rec-cat"
            name="categoryId"
            defaultValue={rule?.categoryId ?? ""}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Starts on"
          required
          error={state.fieldErrors?.startsOn}
          htmlFor="rec-starts"
        >
          <Input
            id="rec-starts"
            type="date"
            name="startsOn"
            required
            defaultValue={
              rule?.startsOn ?? new Date().toISOString().slice(0, 10)
            }
          />
        </Field>
        <Field label="Ends on" hint="Optional" htmlFor="rec-ends">
          <Input
            id="rec-ends"
            type="date"
            name="endsOn"
            defaultValue={rule?.endsOn ?? ""}
          />
        </Field>
      </div>

      <Field label="Note" hint="Optional" htmlFor="rec-note">
        <Textarea
          id="rec-note"
          name="note"
          rows={2}
          defaultValue={rule?.note ?? ""}
          placeholder="Fly.io hosting, ConvertKit, etc."
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : rule ? "Save changes" : "Add recurring rule"}
        </Button>
      </div>
    </form>
  );
}
