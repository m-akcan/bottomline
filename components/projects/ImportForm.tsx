"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { importData } from "@/lib/actions/data";
import type { ActionState } from "@/lib/actions/_shared";

const initial: ActionState = { ok: false };

export function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(importData, initial);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!filename) return; // browser will block via required attribute too
    const ok = window.confirm(
      `This will REPLACE all current data with the contents of "${filename}". This cannot be undone. Continue?`
    );
    if (!ok) {
      e.preventDefault();
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
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

      <label className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
          Backup file
        </span>
        <div className="flex items-center gap-3">
          <label
            htmlFor="import-file"
            className="inline-flex h-10 px-4 items-center bg-card border border-hairline rounded-[4px] text-sm cursor-pointer hover:bg-card-deep transition-colors"
          >
            Choose file…
          </label>
          <input
            id="import-file"
            name="file"
            type="file"
            accept="application/json,.json"
            required
            className="sr-only"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              setFilename(f?.name ?? null);
            }}
          />
          <span className="text-sm text-muted tabular truncate">
            {filename ?? "No file chosen"}
          </span>
        </div>
      </label>

      <div className="pt-2">
        <Button type="submit" variant="danger" disabled={pending || !filename}>
          {pending ? "Importing…" : "Replace all data"}
        </Button>
      </div>
    </form>
  );
}
