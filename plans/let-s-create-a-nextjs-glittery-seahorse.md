# Bottomline — Implementation Plan

## Context

The project is a fresh Next.js 16.2.6 / React 19 / Tailwind v4 install (only the default starter exists under `app/`). The goal is to build an **open-source, self-hosted webpage that tracks costs and earnings per month for personal SaaS / side projects**, with charts, KPIs, and a distinctive hand-rolled look (no shadcn copy-paste).

User decisions locked in before planning:

- **Storage**: SQLite (file-based), via `better-sqlite3` + Drizzle ORM.
- **Auth**: None — single self-hosted user.
- **Features**: multiple projects, monthly time-series chart, category breakdown, MRR / runway metrics.
- **Design**: distinct custom design — unique font pair, distinctive non-stoplight palette, custom-styled Recharts.
- **Theme**: light-only in v1.
- **Root route `/`**: dashboard directly (README is the marketing surface).
- **Forms**: dedicated `/new` pages, not modals.
- **MRR**: sum of active recurring income rules; fall back to last full month's income when no rules.

## Next.js 16 conventions to respect

This is **not the Next.js most training data describes**. Key differences (verified against `node_modules/next/dist/docs/01-app/`):

- `params` and `searchParams` are **Promises** — `await` in server components, `use()` in client components.
- Tailwind v4: `@import 'tailwindcss';` + `@theme inline { ... }` in `globals.css`. Never use the old `@tailwind base/components/utilities` directives.
- Use the `Metadata` API for `<head>`; never hand-roll `<title>` / `<meta>` in the root layout.
- Server Components by default; `'use client'` only where interactivity demands it (forms, charts, dropdowns, active-link logic).

## Data model

A single `entries` table for income + expense (discriminator on `type`), plus a separate `recurring_rules` table that *generates* materialized rows. Editing a rule does not retroactively rewrite history; individual generated entries can be edited or skipped.

**All money is stored as `amount_cents` INTEGER.** SQLite's REAL is a 64-bit float and will accumulate rounding errors on summed financials.

```ts
// db/schema.ts (drizzle-orm/sqlite-core)

projects        (id, slug UNIQUE, name, description, color, launched_on, archived_at, created_at)
categories      (id, name UNIQUE, kind 'expense'|'income', color, sort_order)
entries         (id, project_id FK, type 'income'|'expense', amount_cents, currency 'USD',
                 category_id FK?, occurred_on 'YYYY-MM-DD', note, source_rule_id FK?, created_at)
                 // indexes: (project_id, occurred_on), (type, occurred_on), (source_rule_id)
recurring_rules (id, project_id FK, type, amount_cents, currency, category_id FK?,
                 cadence 'monthly', day_of_month 1..28, starts_on, ends_on?, note, active, created_at)
settings        (key PK, value)  // 'base_currency', 'fiscal_year_start', 'cash_on_hand_cents'
```

**Recurring materialization**: every server-side dashboard read calls `materializeRecurring()` — idempotent, keyed on `(source_rule_id, occurred_on)`. No cron, no scheduler. Future months are *projected* in-memory via `expandRule()` and overlaid on the chart but never written.

**Multi-currency**: per-entry `currency` field, aggregates converted to `settings.base_currency` via a static rate table in `lib/fx.ts`. Hitting a live FX API is a TODO.

## File structure

```
app/
  layout.tsx                              # fonts, <TopNav>, theme tokens
  page.tsx                                # aggregate dashboard (all projects)
  globals.css                             # @import 'tailwindcss'; @theme inline {...}
  loading.tsx                             # global skeleton
  error.tsx                               # 'use client'
  not-found.tsx
  projects/
    page.tsx                              # list
    new/page.tsx                          # create form
    [slug]/
      page.tsx                            # project dashboard (await params)
      edit/page.tsx
      entries/page.tsx                    # paginated table (searchParams filters)
      entries/new/page.tsx
      recurring/page.tsx                  # manage rules
  settings/
    page.tsx
    categories/page.tsx
    general/page.tsx

components/
  nav/        TopNav.tsx, NavLink.tsx ('use client' for usePathname)
  ui/         Button, Card, Field, Input, CurrencyInput ('use client'),
              MonthPicker ('use client'), DatePicker ('use client'), Select ('use client'),
              Tag, EmptyState, Toast ('use client'), Skeleton
  dashboard/  StatTile, Sparkline ('use client'), MonthlyChart ('use client'),
              CategoryBreakdown ('use client'), ProjectCard,
              RunwayBar ('use client'), MrrTile
  entries/    EntryRow, EntryTable, EntryForm ('use client'),
              EntryFilters ('use client'), RecurringForm ('use client')
  projects/   ProjectForm ('use client'), ProjectSwitcher ('use client')

db/
  client.ts                               # singleton better-sqlite3 + drizzle, WAL pragma,
                                          # globalThis cache for HMR, auto-migrate in dev
  schema.ts                               # the tables above
  migrate.ts                              # tsx-runnable migration runner
  migrations/                             # generated by drizzle-kit
  seed.ts                                 # demo data

lib/
  actions/    projects.ts, entries.ts, recurring.ts, settings.ts   # all 'use server'
  queries/    projects.ts, entries.ts, aggregates.ts                # server-only reads
  metrics.ts                              # pure: monthlySeries, mrr, burnRate,
                                          # runwayMonths, monthsToProfitability,
                                          # categoryBreakdown, lifetimeTotals
  recurring.ts                            # pure: expandRule(rule, range)
  money.ts                                # pure: cents<->major, format() via Intl.NumberFormat
  fx.ts                                   # static rate table + convert()
  date.ts                                 # monthKey, monthRange, addMonths
  validators.ts                           # zod schemas shared by forms + actions
  slug.ts                                 # slugify + ensureUnique
  env.ts                                  # zod-validated process.env

data/                                     # gitignored
  bottomline.db

drizzle.config.ts
.env.local                                # DATABASE_PATH=./data/bottomline.db
.gitignore                                # add data/, *.db, *.db-journal
```

## Design system

### Concept

"Engineer's ledger" — warm paper-ivory canvas, deep ink text, an olive-gold accent (signals money without literal green), and a tonal gain/loss pair (moss + terracotta) that reads as a duo, not stoplight UI. Hairline borders, 6px corners, oversized tabular-mono numerics, generous whitespace.

### Fonts (via `next/font/google` in `app/layout.tsx`)

- **Display / sans: Bricolage Grotesque** (variable). Confident, humanist, distinctive at large sizes, readable at body sizes.
- **Mono / numerics: JetBrains Mono** (400/500/700). Tabular by default, unambiguous zeros and ones for currency columns.

Loaded as CSS variables `--font-display` and `--font-mono`; numerics get `font-variant-numeric: tabular-nums`.

### Palette (CSS vars in `@theme inline`)

```css
@theme inline {
  --color-paper:      #f5efe2;
  --color-card:       #fbf7ec;
  --color-ink:        #1a1714;
  --color-muted:      #6b6357;
  --color-hairline:   #d8cfb8;

  --color-olive:      #6b6a2a;   /* primary accent */
  --color-olive-soft: #b8b566;

  --color-gain:       #2f6a3a;   /* deep moss */
  --color-loss:       #a8472b;   /* terracotta */
  --color-gain-soft:  #c9d9ba;
  --color-loss-soft:  #e9c8b8;

  --font-display: var(--font-display);
  --font-mono:    var(--font-mono);

  --radius-card:  6px;
  --radius-input: 4px;
}
```

Tailwind v4 auto-generates utilities: `bg-paper`, `text-ink`, `border-hairline`, `text-gain`, `bg-olive`, etc.

### Component design touches

| Component | Distinguishing detail |
|---|---|
| `Card` | `bg-card`, `border-hairline`, `rounded-[6px]`, no shadow |
| `Button` primary | `bg-ink text-paper`, square-ish, subtle inset highlight on `:active` |
| `Button` ghost | `text-olive` underline; hover thickens via `text-decoration-thickness` |
| `StatTile` | muted uppercase label + 40–56px mono value + inline gain/loss delta chip |
| `MonthlyChart` | only faint horizontal dashed grid; income bars (gain-soft), expense bars (loss-soft), net line (ink 1.5px); mono ticks; staggered entry animation; tooltip is a Card |
| `CategoryBreakdown` | single horizontal stacked bar, hover dims others to 30% |
| `Sparkline` | 28px, gradient fill, last point marked |
| `EntryRow` | left-edge 2px gain/loss bar; date + amount right-aligned mono; hover reveals actions |
| `EntryForm` | big amount input first; currency dropdown attached right; type as segmented control |
| `CurrencyInput` | left adornment for symbol, thousand-separator format on blur, stores cents internally |
| `ProjectCard` | 4px left edge in `project.color`; tiny MRR/burn/net YTD row in mono |
| `Tag` | `bg-card border-hairline rounded-[3px] px-1.5 py-0.5 text-[11px]` with optional leading color dot |
| `RunwayBar` | horizontal bar, tick every 3 months, loss-colored zone past runway end |
| `TopNav` | full-width paper band, wordmark in display-700 with custom underline, olive underline on active route |

### Chart styling rules

- All Recharts components consume `var(--color-*)` strings.
- `<CartesianGrid horizontal vertical={false} strokeDasharray="2 4" stroke="var(--color-hairline)" />` — no full grid.
- Custom tooltip renders a Card with a 3-row mini-table.
- All ticks `fontFamily: 'var(--font-mono)'`, `fill: 'var(--color-muted)'`.
- `<defs>` per chart for gain-soft → transparent gradients.
- Charts are the *only* `'use client'` boundary inside dashboard sections; the wrapping Card stays server-rendered.
- Wrap animations in a `prefers-reduced-motion` guard.

## Implementation order

1. Clean starter: empty `app/page.tsx`, strip `public/*.svg`, reset `globals.css`, update `metadata` in `layout.tsx` (title "Bottomline").
2. Install dependencies (see §Dependencies).
3. `.env.local` with `DATABASE_PATH=./data/bottomline.db`; create `lib/env.ts` (zod); add `data/`, `*.db*` to `.gitignore`.
4. `drizzle.config.ts` + package scripts: `db:generate`, `db:migrate`, `db:seed`, `db:studio`.
5. `db/schema.ts` (five tables from §Data model). Generate first migration.
6. `db/client.ts` singleton (better-sqlite3, WAL pragma, `globalThis` HMR cache, auto-migrate in dev). `db/migrate.ts` runner.
7. Pure libs: `lib/money.ts`, `lib/date.ts`, `lib/fx.ts`, `lib/slug.ts`, `lib/validators.ts`.
8. `lib/metrics.ts` (pure, typed input/output) and `lib/recurring.ts#expandRule`.
9. `lib/queries/*.ts`: `listProjects`, `getProjectBySlug`, `listEntries`, `aggregateMonthly`, `aggregateByCategory`.
10. `lib/actions/*.ts`: each is `'use server'`, zod-parses, writes, `revalidatePath()`s, returns `{ok, message, fieldErrors?}`.
11. `db/seed.ts`: default base currency, 8 default categories, 2 sample projects, ~40 entries across 12 months, 2 recurring rules. Run `pnpm db:seed`.
12. Replace `app/globals.css` with the `@theme inline` block from §Design system. Set body background/font defaults.
13. Update `app/layout.tsx`: load Bricolage + JetBrains Mono via `next/font/google`, attach variables to `<html>`. Build `TopNav` + `NavLink`.
14. Build UI primitives (`Button`, `Card`, `Field`, `Input`, `Select`, `CurrencyInput`, `Tag`, `EmptyState`, `Toast`, `Skeleton`, `MonthPicker`, `DatePicker`). Snapshot visually via a throwaway `app/_dev/page.tsx` (delete later).
15. Build dashboard primitives (`StatTile`, `Sparkline`, `MonthlyChart`, `CategoryBreakdown`, `RunwayBar`, `MrrTile`, `ProjectCard`).
16. `app/page.tsx`: hero stat row (Net YTD, MRR, Burn, Runway), `MonthlyChart`, `CategoryBreakdown`, `ProjectCard` grid.
17. `app/projects/page.tsx` + `app/projects/new/page.tsx` using `ProjectForm` + `useActionState(createProject, initialState)`.
18. `app/projects/[slug]/page.tsx` — `const { slug } = await params`, scoped versions of dashboard components.
19. Entries CRUD: `app/projects/[slug]/entries/page.tsx` (filters via awaited `searchParams`), `EntryTable`, `EntryRow`, `entries/new/page.tsx`.
20. `app/projects/[slug]/recurring/page.tsx` + `RecurringForm`. Materialization runs automatically on dashboard reads (idempotent).
21. `app/settings/categories/page.tsx`, `app/settings/general/page.tsx` (base currency, fiscal year start, cash-on-hand input for runway).
22. `loading.tsx` skeletons per major route; `error.tsx` boundary.
23. Polish: tabular-nums everywhere numbers appear; focus rings `outline-2 outline-offset-2 outline-olive`; keyboard nav on `EntryTable`; reduced-motion guard.
24. Rewrite `README.md`: what it is, screenshot, `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev`.
25. `pnpm lint` and `tsc --noEmit` clean. Ship.

## Dependencies

```bash
# Database
pnpm add better-sqlite3 drizzle-orm
pnpm add -D drizzle-kit @types/better-sqlite3 tsx

# Charts
pnpm add recharts

# Utilities
pnpm add date-fns zod
```

Deliberately **not** installing:

- `dinero.js` / `currency.js` — cents-as-integer + `Intl.NumberFormat` is sufficient; FX lives in `lib/fx.ts`.
- `react-hook-form` — React 19's `useActionState` + `useFormStatus` + server actions + shared zod schemas cover form needs cleanly for this scope.
- A UI framework (shadcn/Mantine/Tremor) — the brief is a custom, unique design system.

## Critical files to be modified or created

- `C:\Users\akcanmuh\src\akcan\bottomline\db\schema.ts`
- `C:\Users\akcanmuh\src\akcan\bottomline\db\client.ts`
- `C:\Users\akcanmuh\src\akcan\bottomline\app\globals.css`
- `C:\Users\akcanmuh\src\akcan\bottomline\app\layout.tsx`
- `C:\Users\akcanmuh\src\akcan\bottomline\app\page.tsx`
- `C:\Users\akcanmuh\src\akcan\bottomline\lib\metrics.ts`
- `C:\Users\akcanmuh\src\akcan\bottomline\lib\recurring.ts`
- `C:\Users\akcanmuh\src\akcan\bottomline\drizzle.config.ts`
- `C:\Users\akcanmuh\src\akcan\bottomline\package.json` (deps + scripts)

## Verification

Manual end-to-end walkthrough after implementation:

1. `pnpm install`
2. `pnpm db:migrate` — creates `data/bottomline.db`.
3. `pnpm db:seed` — populates demo data.
4. `pnpm dev`, open `http://localhost:3000`.
5. Dashboard: Net YTD non-zero, MRR tile populated, monthly chart shows 12 months, category breakdown lists ≥3 categories.
6. Click a project card → project-scoped dashboard renders.
7. `Entries → New` → create an expense in the current month → submit → list shows new row → dashboard MRR/burn/chart all reflect it.
8. Edit that entry's amount → numbers recompute.
9. Delete it → state rolls back.
10. `Recurring → New` → $20/mo hosting rule starting 6 months ago → materialization creates 6 entries → future projection overlays on the chart.
11. `Settings → Categories` → rename a category → entries reflect the change.
12. `pnpm build` succeeds with zero warnings; `pnpm lint` clean.

Functions architected to be pure (testable later with Vitest, not in v1):

- `lib/metrics.ts#monthlySeries` — fixed entries → known buckets.
- `lib/metrics.ts#runwayMonths` — zero/negative burn → `Infinity`; zero cash → `0`.
- `lib/metrics.ts#monthsToProfitability` — never-profitable series → `null`.
- `lib/recurring.ts#expandRule` — partial range overlap, `day_of_month=31` in Feb (clamp to last day).
- `lib/money.ts#format` — locale + rounding.
- `lib/fx.ts#convert` — same-currency identity, round-trip.

## Decisions deferred (not blocking; can be addressed during implementation)

- **Cash on hand**: stored as `settings.cash_on_hand_cents`, edited manually on the settings page. Used by `runwayMonths`.
- **FX**: static table in `lib/fx.ts` for v1; live API is a TODO.
- **Project deletion**: soft-delete via `archived_at`. No hard-delete UI in v1.
- **Dark mode**: not in v1.
