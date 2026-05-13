import { cn } from "@/lib/cn";

export interface RunwayBarProps {
  /** months — Infinity means no burn. */
  months: number;
  /** Cap the displayed scale (in months). Default 24. */
  scaleMonths?: number;
  className?: string;
}

export function RunwayBar({ months, scaleMonths = 24, className }: RunwayBarProps) {
  const finite = Number.isFinite(months);
  const m = finite ? Math.max(0, months) : scaleMonths;
  const pct = Math.min(m / scaleMonths, 1);
  const safe = finite && m >= 6;
  const warn = finite && m >= 3 && m < 6;
  const danger = finite && m < 3;
  const fillColor = !finite
    ? "var(--color-gain)"
    : safe
    ? "var(--color-gain)"
    : warn
    ? "var(--color-olive)"
    : "var(--color-loss)";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative h-3 bg-card-deep border border-hairline rounded-[3px] overflow-hidden">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{
            width: `${pct * 100}%`,
            background: fillColor,
            opacity: 0.85,
          }}
        />
        {/* tick marks every 3 months */}
        {Array.from({ length: Math.floor(scaleMonths / 3) - 1 }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-hairline"
            style={{ left: `${((i + 1) * 3) / scaleMonths * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between tabular text-[10px] text-faint">
        <span>0</span>
        <span>{Math.floor(scaleMonths / 2)}mo</span>
        <span>
          {finite ? `${scaleMonths}mo` : "∞"}
        </span>
      </div>
      <div
        className={cn(
          "tabular text-xs",
          danger ? "text-loss" : warn ? "text-olive-strong" : "text-gain"
        )}
      >
        {!finite
          ? "No burn — infinite runway"
          : m === 0
          ? "Out of runway"
          : `${m.toFixed(1)} months remaining`}
      </div>
    </div>
  );
}
