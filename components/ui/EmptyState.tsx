import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 px-6 border border-dashed border-hairline rounded-[6px] text-center",
        className
      )}
    >
      {icon && <div className="text-faint text-3xl">{icon}</div>}
      <h3 className="text-base font-medium text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-md">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
