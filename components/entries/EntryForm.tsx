"use client";

import { useActionState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { createEntry, updateEntry } from "@/lib/actions/entries";
import type { ActionState } from "@/lib/actions/_shared";
import type { Category, Entry, Project } from "@/db/schema";

const initial: ActionState = { ok: false };

export interface EntryFormProps {
  project: Project;
  categories: Category[];
  baseCurrency: string;
  entry?: Entry;
}

export function EntryForm({ project, categories, baseCurrency, entry }: EntryFormProps) {
  const action = entry ? updateEntry.bind(null, entry.id) : createEntry;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-xl">
      <input type="hidden" name="projectId" value={project.id} />

      {state.message && !state.ok && (
        <p className="text-sm text-loss bg-loss-tint border border-loss-soft rounded-[4px] px-3 py-2">
          {state.message}
        </p>
      )}

      <Field label="Kind" error={state.fieldErrors?.type}>
        <SegmentedControl
          name="type"
          defaultValue={entry?.type ?? "expense"}
          options={[
            { value: "expense", label: "Expense", tone: "loss" },
            { value: "income", label: "Income", tone: "gain" },
          ]}
        />
      </Field>

      <Field label="Amount" required error={state.fieldErrors?.amount} htmlFor="entry-amount">
        <CurrencyInput
          id="entry-amount"
          name="amount"
          currencyName="currency"
          defaultAmount={entry ? entry.amountCents / 100 : undefined}
          defaultCurrency={entry?.currency ?? baseCurrency}
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date" required error={state.fieldErrors?.occurredOn} htmlFor="entry-date">
          <Input
            id="entry-date"
            type="date"
            name="occurredOn"
            required
            defaultValue={entry?.occurredOn ?? new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <Field label="Category" error={state.fieldErrors?.categoryId} htmlFor="entry-cat">
          <Select
            id="entry-cat"
            name="categoryId"
            defaultValue={entry?.categoryId ?? ""}
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

      <Field
        label="Note"
        hint="Optional"
        error={state.fieldErrors?.note}
        htmlFor="entry-note"
      >
        <Textarea
          id="entry-note"
          name="note"
          rows={2}
          defaultValue={entry?.note ?? ""}
          placeholder="Stripe payout, Fly.io invoice, etc."
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : entry ? "Save changes" : "Add entry"}
        </Button>
      </div>
    </form>
  );
}
