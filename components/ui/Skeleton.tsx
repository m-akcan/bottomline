import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-card-deep rounded-[4px]",
        className
      )}
      aria-hidden
    />
  );
}
