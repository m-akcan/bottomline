import { cn } from "@/lib/cn";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-1.5", className)}>
      <span className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
          {label}
          {required && <span className="ml-1 text-loss">*</span>}
        </span>
        {hint && !error && (
          <span className="text-[11px] text-faint">{hint}</span>
        )}
        {error && (
          <span className="text-[11px] text-loss">{error}</span>
        )}
      </span>
      {children}
    </label>
  );
}

export const inputBase =
  "h-10 px-3 bg-paper border border-hairline rounded-[4px] text-sm placeholder:text-faint focus:border-olive focus:outline-none focus:shadow-[0_0_0_3px_var(--color-olive-tint)] transition-shadow";

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={cn(inputBase, "tabular", props.className)}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={cn(
        inputBase,
        "h-auto py-2 leading-relaxed",
        props.className
      )}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={cn(inputBase, "tabular pr-8 cursor-pointer", props.className)}
    />
  );
}
