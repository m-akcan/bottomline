"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { updateSettings } from "@/lib/actions/settings";
import type { ActionState } from "@/lib/actions/_shared";
import { SUPPORTED_CURRENCIES } from "@/lib/fx";

const initial: ActionState = { ok: false };

export interface SettingsFormProps {
  baseCurrency: string;
  cashOnHandCents: number;
  fiscalYearStartMonth: number;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SettingsForm({
  baseCurrency,
  cashOnHandCents,
  fiscalYearStartMonth,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(updateSettings, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-xl">
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

      <Field
        label="Base currency"
        hint="All aggregates are converted to this currency."
        htmlFor="set-curr"
      >
        <Select id="set-curr" name="baseCurrency" defaultValue={baseCurrency}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Cash on hand"
        hint="Used to compute runway"
        error={state.fieldErrors?.cashOnHand}
        htmlFor="set-cash"
      >
        <Input
          id="set-cash"
          name="cashOnHand"
          inputMode="decimal"
          defaultValue={(cashOnHandCents / 100).toFixed(2)}
          placeholder="0.00"
        />
      </Field>

      <Field label="Fiscal year starts" htmlFor="set-fy">
        <Select
          id="set-fy"
          name="fiscalYearStartMonth"
          defaultValue={String(fiscalYearStartMonth)}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
