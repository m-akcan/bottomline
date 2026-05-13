import { cn } from "@/lib/cn";

export interface TagProps {
  children: React.ReactNode;
  /** Optional leading dot color. */
  color?: string;
  className?: string;
  tone?: "default" | "gain" | "loss" | "muted";
}

export function Tag({ children, color, tone = "default", className }: TagProps) {
  const toneClass =
    tone === "gain"
      ? "bg-gain-tint text-gain border-gain-soft"
      : tone === "loss"
      ? "bg-loss-tint text-loss border-loss-soft"
      : tone === "muted"
      ? "bg-paper-deep text-muted border-hairline"
      : "bg-card text-ink-soft border-hairline";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-[3px] px-1.5 py-0.5 text-[11px] leading-none tabular",
        toneClass,
        className
      )}
    >
      {color && (
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {children}
    </span>
  );
}
