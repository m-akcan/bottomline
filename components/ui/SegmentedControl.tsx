"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  tone?: "gain" | "loss" | "default";
}

export interface SegmentedControlProps<T extends string = string> {
  name: string;
  options: SegmentedOption<T>[];
  defaultValue?: T;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  name,
  options,
  defaultValue,
  className,
}: SegmentedControlProps<T>) {
  const [value, setValue] = useState<T>(defaultValue ?? options[0]?.value);
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex p-0.5 bg-card-deep border border-hairline rounded-[5px] gap-0.5",
        className
      )}
    >
      <input type="hidden" name={name} value={value} />
      {options.map((opt) => {
        const active = value === opt.value;
        const toneActive =
          opt.tone === "gain"
            ? "bg-gain-tint text-gain"
            : opt.tone === "loss"
            ? "bg-loss-tint text-loss"
            : "bg-paper text-ink";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setValue(opt.value)}
            className={cn(
              "h-7 px-3 text-xs rounded-[3px] transition-colors tracking-[0.02em]",
              active
                ? `${toneActive} shadow-[0_1px_0_rgba(0,0,0,0.04)]`
                : "text-muted hover:text-ink"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
