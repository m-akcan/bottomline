"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

export interface EntryFiltersProps {
  basePath: string;
}

const TYPE_OPTS: Array<{ value: string; label: string; tone?: "gain" | "loss" }> = [
  { value: "all", label: "All" },
  { value: "income", label: "Income", tone: "gain" },
  { value: "expense", label: "Expense", tone: "loss" },
];

export function EntryFilters({ basePath }: EntryFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentType = params.get("type") ?? "all";

  function setType(t: string) {
    const next = new URLSearchParams(params.toString());
    if (t === "all") next.delete("type");
    else next.set("type", t);
    startTransition(() => {
      router.push(`${basePath}?${next.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex p-0.5 bg-card-deep border border-hairline rounded-[5px] gap-0.5">
        {TYPE_OPTS.map((opt) => {
          const active = currentType === opt.value;
          const tone =
            opt.tone === "gain"
              ? "bg-gain-tint text-gain"
              : opt.tone === "loss"
              ? "bg-loss-tint text-loss"
              : "bg-paper text-ink";
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                "h-7 px-3 text-xs rounded-[3px] transition-colors",
                active ? tone : "text-muted hover:text-ink"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
