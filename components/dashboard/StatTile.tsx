import { cn } from "@/lib/cn";
import { formatMoney, formatPercent } from "@/lib/money";

export interface StatTileProps {
  label: string;
  /** Cents in base currency. If not money, pass `format="number"` or `format="percent"`. */
  valueCents?: number;
  /** Pre-formatted value text (overrides valueCents formatting). */
  value?: React.ReactNode;
  /** Optional small annotation below the value, e.g. "vs last month". */
  caption?: string;
  /** Delta in cents (or fraction if format=percent). Sign drives color. */
  delta?: number;
  deltaSuffix?: string;
  currency?: string;
  format?: "money" | "number" | "percent";
  /** Right-side slot for a sparkline or icon. */
  trailing?: React.ReactNode;
  /** Highlight color for the left rail. */
  accent?: "olive" | "gain" | "loss" | "muted";
  className?: string;
}

const accentClass: Record<NonNullable<StatTileProps["accent"]>, string> = {
  olive: "bg-olive",
  gain: "bg-gain",
  loss: "bg-loss",
  muted: "bg-hairline",
};

export function StatTile({
  label,
  valueCents,
  value,
  caption,
  delta,
  deltaSuffix,
  currency = "USD",
  format = "money",
  trailing,
  accent = "olive",
  className,
}: StatTileProps) {
  let display: React.ReactNode = value;
  if (display == null && valueCents != null) {
    if (format === "money") {
      display = formatMoney(valueCents, { currency, compactCents: true });
    } else if (format === "percent") {
      display = formatPercent(valueCents);
    } else {
      display = valueCents.toLocaleString();
    }
  }

  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = showDelta && (delta as number) >= 0;

  return (
    <div
      className={cn(
        "relative bg-card border border-hairline rounded-[6px] pl-5 pr-4 py-4 flex items-start gap-3",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[2px] rounded-r",
          accentClass[accent]
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
          <div className="tabular text-[28px] sm:text-[32px] leading-none text-ink">
            {display ?? "—"}
          </div>
          {showDelta && (
            <span
              className={cn(
                "tabular text-[11px] px-1.5 py-0.5 rounded-[3px] border",
                positive
                  ? "text-gain bg-gain-tint border-gain-soft"
                  : "text-loss bg-loss-tint border-loss-soft"
              )}
            >
              {positive ? "+" : ""}
              {format === "money"
                ? formatMoney(delta as number, { currency, signed: false, compactCents: true })
                : format === "percent"
                ? formatPercent(delta as number)
                : (delta as number).toLocaleString()}
              {deltaSuffix && <span className="ml-1 text-faint">{deltaSuffix}</span>}
            </span>
          )}
        </div>
        {caption && (
          <div className="mt-1.5 text-xs text-muted">{caption}</div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
