import { cn } from "@/lib/cn";
import Link from "next/link";

type Variant = "primary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 select-none transition-colors transition-shadow disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink-soft active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] border border-ink",
  ghost:
    "bg-transparent text-olive hover:text-olive-strong [text-decoration:underline] [text-decoration-thickness:1px] [text-underline-offset:5px] hover:[text-decoration-thickness:2px]",
  quiet:
    "bg-card text-ink hover:bg-card-deep border border-hairline",
  danger:
    "bg-card text-loss hover:bg-loss-tint border border-hairline",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-[4px] tracking-[0.02em]",
  md: "h-10 px-4 text-sm rounded-[4px] tracking-[0.01em]",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export interface ButtonProps
  extends BaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </button>
  );
}

export interface LinkButtonProps extends BaseProps {
  href: string;
  prefetch?: boolean;
}

export function LinkButton({
  href,
  prefetch,
  variant = "primary",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </Link>
  );
}
