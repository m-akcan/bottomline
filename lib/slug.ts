const RESERVED_SLUGS = new Set(["new", "archived", "edit", "settings"]);

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (RESERVED_SLUGS.has(base)) return `${base}-project`;
  return base;
}

/** Append -2, -3, ... until the slug is not in `taken`. */
export function ensureUniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
