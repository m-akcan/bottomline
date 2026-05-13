/** Tiny classname joiner — no clsx dep. */
export function cn(...parts: Array<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(" ");
}
