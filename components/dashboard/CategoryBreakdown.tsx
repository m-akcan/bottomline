"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatMoney, formatPercent } from "@/lib/money";

export interface CategoryBreakdownSlice {
  id: number | null;
  name: string;
  color: string;
  totalCents: number;
  fraction: number;
}

export interface CategoryBreakdownProps {
  slices: CategoryBreakdownSlice[];
  currency?: string;
}

export function CategoryBreakdown({
  slices,
  currency = "USD",
}: CategoryBreakdownProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = slices.reduce((s, x) => s + x.totalCents, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted tabular">No expenses recorded yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex w-full h-3 rounded-[3px] overflow-hidden border border-hairline"
        onMouseLeave={() => setHovered(null)}
      >
        {slices.map((s) => {
          const key = `${s.id ?? "uncat"}-${s.name}`;
          const isDimmed = hovered != null && hovered !== key;
          return (
            <div
              key={key}
              role="img"
              aria-label={`${s.name}: ${formatPercent(s.fraction)}`}
              onMouseEnter={() => setHovered(key)}
              className={cn(
                "h-full transition-opacity duration-200",
                isDimmed ? "opacity-30" : "opacity-100"
              )}
              style={{
                width: `${Math.max(s.fraction * 100, 0.6)}%`,
                background: s.color,
              }}
            />
          );
        })}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {slices.map((s) => {
            const key = `${s.id ?? "uncat"}-${s.name}`;
            const isHovered = hovered === key;
            return (
              <tr
                key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "transition-colors",
                  isHovered && "bg-card-deep"
                )}
              >
                <td className="py-1.5 pr-2 w-3">
                  <span
                    aria-hidden
                    className="inline-block w-2 h-2 rounded-[2px]"
                    style={{ background: s.color }}
                  />
                </td>
                <td className="py-1.5 pr-2 text-ink-soft">{s.name}</td>
                <td className="py-1.5 pr-2 text-right tabular text-muted">
                  {formatPercent(s.fraction)}
                </td>
                <td className="py-1.5 text-right tabular text-ink">
                  {formatMoney(s.totalCents, { currency, compactCents: true })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
