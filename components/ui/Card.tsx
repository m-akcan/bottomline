import { cn } from "@/lib/cn";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Adds the top-left "tab" corner accent. */
  tabbed?: boolean;
  /** A small label rendered in the top-left, uppercase. */
  eyebrow?: string;
  /** Title rendered next to the eyebrow. */
  title?: React.ReactNode;
  /** Right-aligned actions in the header. */
  actions?: React.ReactNode;
  /** Render without padding for charts / tables. */
  flush?: boolean;
}

export function Card({
  tabbed,
  eyebrow,
  title,
  actions,
  flush,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "relative bg-card border border-hairline rounded-[6px]",
        tabbed && "before:content-[''] before:absolute before:-top-[1px] before:left-4 before:w-10 before:h-[3px] before:bg-olive before:rounded-b-[2px]",
        className
      )}
    >
      {(eyebrow || title || actions) && (
        <div
          className={cn(
            "flex items-start justify-between gap-4 border-b border-hairline",
            flush ? "px-5 py-3" : "px-5 py-4"
          )}
        >
          <div className="flex flex-col gap-0.5">
            {eyebrow && (
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="text-base font-medium tracking-tight text-ink">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(flush ? "" : "p-5")}>{children}</div>
    </div>
  );
}
