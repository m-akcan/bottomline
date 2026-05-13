<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bottomline — agent guide

Operational rules for anyone (human or AI) editing this codebase. Read this
before writing code — many of the conventions here are non-obvious and the
codebase will silently misbehave if you violate them.

## What this project is

A self-hosted single-user finance ledger for indie SaaS / side projects.
SQLite-backed, no auth, hand-rolled design system. See `README.md` for the
user-facing concepts (MRR, burn, runway, recurring rules, etc.) — this file
focuses on conventions for editing the code.

## Stack — the parts that bite

| Layer | Version | Notes |
| --- | --- | --- |
| Next.js | **16.2.6** | App Router, Server Actions, Turbopack |
| React | **19.2.4** | `useActionState`, server components |
| Tailwind | **v4** | `@import 'tailwindcss';` + `@theme inline`, NOT v3 directives |
| TypeScript | **5**, strict | |
| DB | `better-sqlite3` 12 + Drizzle 0.45 | Synchronous, single-user |
| Forms | Native `<form>` + server actions | No `react-hook-form` |
| Validation | Zod 4 | Note: `z.SafeParseReturnType` is gone in v4 |

## Hard rules — read these or break things

### Next.js 16 specifics

- **`params` and `searchParams` are Promises.** Always `await` them in server
  components or use `use()` in client components:

  ```tsx
  export default async function Page({
    params,
  }: {
    params: Promise<{ slug: string }>;
  }) {
    const { slug } = await params;
  }
  ```

- **`<head>` is managed via the `Metadata` API.** Never hand-write `<title>`
  or `<meta>` tags.

- **Server Components are the default.** Only add `"use client"` when you
  need state, effects, or browser APIs. Each `"use client"` boundary is a
  client bundle cost.

- **Inline `"use server"` is only valid in async server functions** — it does
  NOT work in client components. To pass an action to a client form, import
  the named server action and use `.bind(null, arg)` for partial application.

### Tailwind v4

- **Design tokens are in `app/globals.css`** under `@theme inline { ... }`.
  Tailwind auto-generates utilities from them (`bg-paper`, `text-ink`,
  `border-hairline`, `text-gain`, etc.).
- **Never use `@tailwind base/components/utilities`** — that's v3 syntax.
- **No `tailwind.config.js`.** v4 is config-by-CSS.

### Money

- **Always store cents as INTEGER.** SQLite's REAL is a 64-bit float and
  accumulates rounding error on summed financials. Convert at the boundary:
  - Input from forms: `toCents(Number(amount))` in `lib/money.ts`
  - Display: `formatMoney(cents, { currency })` — uses `Intl.NumberFormat`
- **Never multiply or divide cents directly** without `Math.round()`.

### Server actions

- **One server action file per resource** in `lib/actions/` (`projects.ts`,
  `entries.ts`, `recurring.ts`, etc.). Each file starts with `"use server"`.
- **Files with `"use server"` can only export async functions.** Non-async
  exports break the build. Put shared helpers in `lib/actions/_shared.ts`
  (which has NO `"use server"` directive).
- **Validate with zod via `fromFormData(schema, formData)`** from `_shared.ts`.
  Return `{ ok, message?, fieldErrors? }` shape — never throw.
- **`revalidatePath()` after mutations.** Revalidate `/` and any affected
  project route. Do this BEFORE `redirect()` since `redirect()` throws.
- **Bind args, don't close over them in inline actions inside client
  components.** Example:

  ```tsx
  // GOOD — in a server or client component
  <form action={deleteCategory.bind(null, c.id)}>...</form>

  // BAD — inline "use server" inside a client component (illegal)
  <form action={async () => { "use server"; await deleteCategory(c.id); }}>
  ```

### Database

- **`db` and `sqlite` are singletons** on `globalThis` for HMR survival
  (`db/client.ts`). Don't re-create connections.
- **Drizzle queries return synchronously** with `better-sqlite3` — use
  `.all()`, `.get()`, `.run()`. No `await` needed for DB ops themselves.
- **FK on, WAL mode on.** Configured in `db/client.ts`.
- **Schema changes require a migration.** Edit `db/schema.ts`, then
  `pnpm db:generate` to create the SQL, then `pnpm db:migrate` to apply.
- **Indexes matter.** Existing ones: `(project_id, occurred_on)`,
  `(type, occurred_on)`, `(source_rule_id)`. Add more if you write new
  range-scan queries.
- **Drizzle's `.run()` returns `{ changes, lastInsertRowid }`** — use
  `result.changes ?? 0` defensively.

### Component conventions

- **All components are server components by default.** Mark client ones with
  `"use client"` as the very first line of the file.
- **`Card` is the default container.** Don't invent new card-like wrappers.
  Use `tabbed`, `eyebrow`, `title`, `actions`, `flush` props.
- **Numbers are always `tabular` font-class** (mono + `tabular-nums`).
- **Use `cn()` from `lib/cn.ts`** for conditional class strings. No `clsx`
  dependency.
- **No emoji in UI** unless the user explicitly asks. The design language is
  intentionally austere.
- **Escape apostrophes in JSX text** with `&rsquo;` / `&apos;` — `react/no-
  unescaped-entities` is enforced by ESLint.

### Pure libs

Anything in `lib/metrics.ts`, `lib/recurring.ts`, `lib/money.ts`, `lib/date.ts`,
`lib/fx.ts`, `lib/slug.ts` is **pure** — no DB, no fetch, no side effects.
Keep them that way. They take already-fetched data and return computed values
so they remain unit-testable.

### Recurring rules — the tricky one

- **Auto-materialize is forward-only.** `materializeRecurring()` only inserts
  months STRICTLY AFTER the latest existing entry per rule. This is what
  makes deletions stick. Do NOT change this without thinking hard.
- **Full gap-fill is opt-in** via `regenerateRuleEntries(ruleId)` / the
  *Regenerate* button. Use `pendingMaterializations` (not the `Forward` one).
- **Rule edits propagate fields to past entries.** `type`, `amount_cents`,
  `currency`, `category_id`, `note` are propagated via a single
  `UPDATE entries WHERE source_rule_id = ?`. Date fields are NEVER propagated.
- **Deleting a rule sets entries' `source_rule_id` to NULL** via FK cascade.
  Entries persist — they become orphaned ad-hoc entries.

## Layout

```
app/                  Routes (App Router)
  api/export/         JSON download endpoint
components/
  ui/                 Primitives — Button, Card, Field, Input, etc.
  nav/                TopNav + NavLink
  dashboard/          StatTile, charts, ProjectCard
  entries/            EntryForm, EntryTable, RecurringForm
  projects/           ProjectForm, SettingsForm, CategoryEditor,
                      ArchivedProjectRow, ImportForm
db/
  schema.ts           Drizzle tables — single source of truth
  client.ts           Singleton db + sqlite
  migrate.ts          tsx-runnable migration runner
  seed.ts             Demo data (idempotent — wipes first)
  migrations/         Generated SQL
lib/
  actions/            'use server' mutations + _shared.ts helpers
  queries/            Server-only reads (typed Drizzle)
  metrics.ts          Pure aggregation
  recurring.ts        Pure rule expansion + materialization diff
  money.ts            Cents <-> major + Intl helpers
  date.ts             Month bucketing
  fx.ts               Static currency rates
  settings.ts         KV settings read/write
  slug.ts             slugify + reserved-names
  validators.ts       Shared zod schemas
  env.ts              Zod-validated process.env
  cn.ts               Class joiner
```

## Conventions for new features

When adding something new, the workflow is almost always:

1. **Schema change** if needed → `db/schema.ts` → `pnpm db:generate` →
   `pnpm db:migrate`.
2. **Zod schema** in `lib/validators.ts` shared by the form and the action.
3. **Server action** in `lib/actions/<resource>.ts` that returns `ActionState`
   and calls `revalidatePath`.
4. **Query** in `lib/queries/<resource>.ts` if you need a new read. Default to
   filtering archived projects out (`isNull(projects.archivedAt)`).
5. **Component** — server by default; only `"use client"` if the form needs
   `useActionState` or you need browser APIs.
6. **Page** in `app/.../page.tsx` — async, awaits `params` / `searchParams`,
   calls queries and renders.

## Verification — before declaring done

```sh
pnpm typecheck       # tsc --noEmit, must be clean
pnpm lint            # ESLint, must be clean
pnpm build           # Production build, must succeed
```

Then smoke the actual routes:

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/projects
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/settings/data
```

## Common pitfalls

- **Inline server actions in client components** → "use client directive
  must be placed before other expressions" or "useActionState in a Server
  Component" build errors. Use `.bind()`.
- **Forgetting to `await params`** → silent runtime error in production,
  works in dev with deprecation warning.
- **Re-using `eq` array type for mixed conds** → use `SQL[]` type from
  `drizzle-orm` when mixing `eq`, `gte`, `isNull`, etc.
- **Recharts SSR warnings** (`width(-1) height(-1)`) — these are cosmetic
  during prerender. Wrap `ResponsiveContainer` with explicit height on the
  parent div and pass `minWidth={0} minHeight={0}` to silence them.
- **Editing the FX table** without restarting the dev server — `lib/fx.ts`
  is module-imported and the table is captured at module load.
- **Adding a project slug that collides with a route** → `slugify()` in
  `lib/slug.ts` reserves `new`, `archived`, `edit`, `settings`. Add to the
  set if you add more static project sub-routes.

## Running things

```sh
pnpm install
pnpm db:migrate        # ensure schema is current
pnpm db:seed           # demo data — wipes first, so don't run on real data
pnpm dev               # http://localhost:3000

pnpm typecheck
pnpm lint
pnpm build
pnpm start             # production server

pnpm db:generate       # after editing db/schema.ts
pnpm db:studio         # GUI DB explorer
```

`tsx` is used to run TypeScript scripts directly (`db/migrate.ts`,
`db/seed.ts`). When debugging schema issues, `pnpm db:studio` is the
fastest way to inspect actual rows.

## What is intentionally NOT in this codebase

- **No auth.** Single self-hosted user. Don't add NextAuth.
- **No dark mode.** Light only in v1. If you add dark, do it as a second
  `@theme inline` block keyed on `[data-theme="dark"]`.
- **No shadcn / Mantine / Tremor.** The design system is hand-rolled and
  staying that way. New components go in `components/ui/`.
- **No `react-hook-form`.** `useActionState` + native validation + shared zod
  schemas handle everything.
- **No `dinero.js` / `currency.js`.** Cents + `Intl.NumberFormat` is enough.
- **No tests** (yet). Pure libs are architected to be testable later — keep
  them pure.
