"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { createCategory, deleteCategory } from "@/lib/actions/categories";
import type { ActionState } from "@/lib/actions/_shared";
import type { Category } from "@/db/schema";

const initial: ActionState = { ok: false };

const SWATCHES = [
  "#a8472b",
  "#b8854a",
  "#6b6a2a",
  "#7a5a8a",
  "#5a8a7a",
  "#8a5a6a",
  "#8a7a4a",
  "#4a7a8a",
  "#2f6a3a",
  "#1a1714",
];

export function CategoryEditor({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategory, initial);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted mb-3">
          Existing
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-hairline border border-hairline rounded-[6px] bg-card">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span
                  aria-hidden
                  className="w-3 h-3 rounded-[2px]"
                  style={{ background: c.color }}
                />
                <span className="text-sm flex-1">{c.name}</span>
                <Tag tone={c.kind === "income" ? "gain" : "muted"}>
                  {c.kind}
                </Tag>
                <form action={deleteCategory.bind(null, c.id)}>
                  <Button variant="danger" size="sm">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted mb-3">
          Add new
        </h2>
        <form action={formAction} className="flex flex-col gap-4">
          {state.message && !state.ok && (
            <p className="text-sm text-loss bg-loss-tint border border-loss-soft rounded-[4px] px-3 py-2">
              {state.message}
            </p>
          )}
          <Field label="Name" required error={state.fieldErrors?.name} htmlFor="cat-name">
            <Input id="cat-name" name="name" required placeholder="Hosting" />
          </Field>
          <Field label="Kind" htmlFor="cat-kind">
            <Select id="cat-kind" name="kind" defaultValue="expense">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((c, i) => (
                <label key={c} className="cursor-pointer" title={c}>
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={i === 0}
                    className="peer sr-only"
                  />
                  <span
                    className="block w-7 h-7 rounded-[4px] border border-hairline peer-checked:ring-2 peer-checked:ring-olive peer-checked:ring-offset-2 peer-checked:ring-offset-paper transition-shadow"
                    style={{ background: c }}
                  />
                </label>
              ))}
            </div>
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add category"}
          </Button>
        </form>
      </div>
    </div>
  );
}
