# bottomline

An open-source, self-hosted ledger for indie SaaS and side projects. Track every
dollar in and out, watch MRR, burn, runway, and net month over month — without
shipping your numbers to a third party.

Single-user, single binary's-worth of dependencies, single SQLite file you own.

---

## Contents

- [Features](#features)
- [Stack](#stack)
- [Quickstart](#quickstart)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Concepts](#concepts)
  - [Money](#money)
  - [Projects](#projects)
  - [Entries](#entries)
  - [Recurring rules](#recurring-rules)
  - [Categories](#categories)
  - [MRR](#mrr)
  - [Burn rate](#burn-rate)
  - [Runway](#runway)
  - [Multi-currency](#multi-currency)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Design system](#design-system)
- [Export & import](#export--import)
- [Deployment](#deployment)
- [FAQ](#faq)
- [License](#license)

---

## Features

- **Multiple projects** — each with its own color, entries, recurring rules, and
  per-project dashboard.
- **Aggregate dashboard** — KPIs across the whole portfolio: Net YTD, MRR, gross
  burn, net-burn runway, and lifetime totals.
- **Monthly chart** — trailing 12 months of income, expense, and net (composed
  bars + net line), with a custom paper-card tooltip.
- **Income & expense breakdowns** — twin trailing-12-month category breakdowns
  showing where the money comes from and where it goes.
- **Recurring rules** — monthly subscriptions and recurring revenue auto-materialize
  into past entries. Editing a rule propagates field changes (amount, category,
  type, currency, note) to past entries automatically. A *Regenerate* button
  restores entries you deleted manually.
- **Archive & hard-delete** — projects can be archived (hidden from the dashboard,
  preserved for restore) or permanently deleted (cascades to entries and rules).
- **Multi-currency** — entries in any of 13 supported ISO currencies, aggregated
  to your base currency at a static FX rate (editable in `lib/fx.ts`).
- **Export & import** — single-file JSON backup that round-trips losslessly,
  preserving IDs and foreign keys. `curl`-able for automated backups.
- **Custom design system** — hand-rolled components, no shadcn/Mantine
  copy-paste. Bricolage Grotesque + JetBrains Mono on warm paper.
- **No accounts, no telemetry, no SaaS** — your data lives in a SQLite file you
  own. Run it on `localhost`, in a Docker container, on a Pi — wherever.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) | First-class server actions for forms; statically-rendered dashboard |
| Runtime | React 19 | `useActionState`, server components |
| Styling | Tailwind CSS v4 | `@theme inline` for hand-rolled tokens, no config file |
| Language | TypeScript 5, strict | Drizzle gives end-to-end types from DB to UI |
| DB | SQLite via `better-sqlite3` | Synchronous, fast, zero infra, perfect for single-user |
| ORM | Drizzle ORM + drizzle-kit | Typed queries, generated migrations |
| Charts | Recharts | Composable enough to fully restyle |
| Forms | Native `<form>` + server actions + `useActionState` | No `react-hook-form` needed |
| Validation | Zod | Shared schemas between form + server action |
| Dates | date-fns | Tree-shakable, sane API |
| Package manager | pnpm | Fast, content-addressable |

---

## Quickstart

```sh
git clone <repo>
cd bottomline
pnpm install
pnpm db:migrate     # creates ./data/bottomline.db
pnpm db:seed        # optional — 2 demo projects, 12 months of activity
pnpm dev
```

Open <http://localhost:3000>.

> **Note:** This project uses Next.js 16. `params` and `searchParams` are
> Promises and must be `await`ed in server components. Tailwind v4 uses
> `@import 'tailwindcss';` in `globals.css`, not the old `@tailwind` directives.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Run the production server |
| `pnpm lint` | ESLint (flat config) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | Generate a new Drizzle migration from `db/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations to the SQLite file |
| `pnpm db:seed` | Wipe and reseed with demo data |
| `pnpm db:studio` | Drizzle Studio (browse the DB in a GUI) |

---

## Configuration

### Environment

A single env var lives in `.env.local`:

```
DATABASE_PATH=./data/bottomline.db
```

That's it. The `data/` directory is gitignored.

### In-app settings

Available under **Settings**:

| Setting | Description |
| --- | --- |
| Base currency | All aggregates convert into this currency. Default `USD`. |
| Cash on hand | Used as the numerator in the runway calculation. |
| Fiscal year start month | For future fiscal-year aggregations. |
| Categories | Add/rename/delete; income or expense kind, per-category color. |
| Export & import | Download a JSON backup or replace all data from one. |

---

## Concepts

### Money

Stored everywhere as `amount_cents` `INTEGER`. SQLite's `REAL` is a 64-bit
float and accumulates rounding error on summed financials — so no floats, ever.
Display uses `Intl.NumberFormat`.

### Projects

A project groups everything: entries, recurring rules, color, an optional
description and launch date.

- **Archive** — sets `archived_at`. Hidden from the dashboard and aggregates.
  Restorable from **Projects → Archived** (or via the project's edit page).
- **Delete permanently** — cascades through entries and recurring rules.
  Available from the edit page and the archived list. Not undoable.

The slugifier reserves `new`, `archived`, `edit`, `settings` so a project name
can't collide with a route.

### Entries

A single table for income and expense (`type` column). One entry = one
transaction. Each has:

- A `type`, `amount_cents`, `currency`
- A `project_id` (required)
- An optional `category_id`
- An `occurred_on` date (the canonical date used for monthly bucketing)
- An optional `note`
- An optional `source_rule_id` pointing at the recurring rule that generated it

### Recurring rules

Monthly subscriptions, recurring revenue, anything that repeats at a fixed
day-of-month. Rules **generate** entries — they don't replace them. Each rule
defines amount, type, currency, category, day-of-month, start date, optional
end date.

#### Auto-materialization

On every dashboard read, the app runs an idempotent
`materializeRecurring()` that inserts any missing entries for active rules.

**Forward-only semantics**: only months strictly after the latest existing entry
for each rule are filled in. This means **manually deleting an entry sticks** —
auto-materialization won't resurrect it.

#### Editing a rule

When you save a rule edit, the following fields propagate to all materialized
entries from that rule:

| Field | Propagates? |
| --- | --- |
| `type` | yes |
| `amount_cents` | yes |
| `currency` | yes |
| `category_id` | yes |
| `note` | yes |
| `day_of_month` | no (would silently rewrite history) |
| `starts_on`, `ends_on` | no |

The save message tells you how many entries were touched
("*Saved. Updated 8 past entries to match.*").

#### Regenerate

The *Regenerate* button on each rule does a **full gap-fill** — inserts any
(rule, month) that's currently missing, including ones you deleted manually or
months exposed by extending `starts_on` backwards. Idempotent.

#### Deleting a rule

The rule is removed. Past entries are **kept** — their `source_rule_id` is set
to `NULL` and they continue to behave like ad-hoc entries from then on.

### Categories

Per-entry classification. Two kinds: `expense` (the default) and `income`. Each
category has a color used in the breakdown panels.

To get a useful **"Where the money comes from"** breakdown, add a few
`income`-kind categories under **Settings → Categories** and assign them to
your income rules. The field propagation will push the category onto past
entries automatically.

### MRR

**Monthly Recurring Revenue**, not "monthly income." Computed two ways:

1. Primary: **sum of active recurring income rules' monthly amounts**.
2. Fallback (when a project has no income rules): **last full calendar month's
   income**.

The MRR tile caption tells you which one is being shown.

### Burn rate

**Gross** monthly expense — i.e., cash going out, not netted against revenue.
Industry-standard definition. Computed as the **average over the trailing 3
months**.

A €60 domain renewal will spike this by €20/mo for three months even if your
steady-state spend is much lower — check the entries table if burn looks off.

### Runway

**Net-burn-based**, the industry-standard definition:

> `runway = cash on hand ÷ (avg monthly expense − avg monthly income, trailing 3mo)`

- If net burn ≤ 0 (break-even or profitable), Runway shows **∞** with a green
  *Profitable* badge.
- Otherwise, months are shown, plus a caption explaining the math:
  *"Cash on hand: €100 · burns €2.95/mo net"*.

This is the realistic runway. If you want a stress-test of "what if revenue
goes to zero tomorrow," divide your cash by the gross **Burn** tile directly.

### Multi-currency

Entries can be in any of the supported currencies. Aggregates convert into
your base currency via a static rate table in `lib/fx.ts`. Editing rates
requires editing the file and restarting the server.

Supported: USD, EUR, GBP, CAD, AUD, CHF, JPY, INR, BRL, TRY, MXN, SGD, ZAR.

> **Future:** wire a daily-cached free FX API (e.g. open.er-api.com). For
> v1 the static table is good enough for a self-hosted single-user app.

---

## Architecture

```
app/
  layout.tsx                          # Fonts, <TopNav>, footer
  page.tsx                            # Aggregate dashboard
  globals.css                         # @theme inline { ... } design tokens
  loading.tsx, error.tsx, not-found.tsx
  api/
    export/route.ts                   # GET full-DB JSON download
  projects/
    page.tsx                          # List (with ?show=archived toggle)
    new/page.tsx
    [slug]/
      page.tsx                        # Project dashboard
      edit/page.tsx                   # Edit + archive + hard-delete
      entries/page.tsx                # Paginated entries + type filter
      entries/new/page.tsx
      recurring/page.tsx              # Manage rules
      recurring/[id]/edit/page.tsx    # Edit a rule
  settings/
    page.tsx                          # Index
    general/page.tsx                  # Base currency, cash, fiscal year
    categories/page.tsx               # CRUD categories
    data/page.tsx                     # Export + import

components/
  nav/         TopNav, NavLink (active-route logic, client)
  ui/          Button, Card, Field, Input, Select, CurrencyInput,
               SegmentedControl, Tag, EmptyState, Skeleton
  dashboard/   StatTile, Sparkline, MonthlyChart, CategoryBreakdown,
               RunwayBar, ProjectCard
  entries/     EntryRow, EntryTable, EntryForm, EntryFilters,
               RecurringForm
  projects/    ProjectForm, SettingsForm, CategoryEditor,
               ArchivedProjectRow, ImportForm

db/
  schema.ts                           # Drizzle table definitions
  client.ts                           # singleton better-sqlite3 (WAL, FK on)
  migrate.ts                          # tsx-runnable migration runner
  migrations/                         # generated SQL
  seed.ts                             # demo data

lib/
  actions/                            # 'use server' mutations
    projects.ts, entries.ts, recurring.ts,
    categories.ts, settings.ts, data.ts (import)
    _shared.ts                        # ActionState + zod-from-FormData helpers
  queries/                            # server-only typed reads
    projects.ts, entries.ts, materialize.ts
  metrics.ts                          # pure: monthlySeries, mrr*, burnRate,
                                      # netBurnRate, runwayMonths,
                                      # categoryBreakdown, ytdNet,
                                      # lifetimeTotals, monthsToProfitability
  recurring.ts                        # pure: expandRule,
                                      # pendingForwardMaterializations,
                                      # pendingMaterializations
  money.ts                            # cents <-> major, Intl.NumberFormat
  date.ts                             # monthKey, monthsInRange, ranges
  fx.ts                               # static rate table + convert()
  settings.ts                         # KV settings helpers
  slug.ts                             # slugify + reserved-name list
  validators.ts                       # zod schemas shared by forms + actions
  env.ts                              # zod-validated process.env
  cn.ts                               # tiny classname joiner

data/                                 # gitignored
  bottomline.db                       # the database file
```

---

## Data model

```
projects            id, slug UNIQUE, name, description, color, launched_on,
                    archived_at, created_at

categories          id, name UNIQUE, kind ('expense'|'income'), color, sort_order

entries             id, project_id FK, type ('income'|'expense'),
                    amount_cents, currency, category_id FK?, occurred_on,
                    note, source_rule_id FK?, created_at
                    -- indexes: (project_id, occurred_on), (type, occurred_on),
                    --          (source_rule_id)

recurring_rules     id, project_id FK, type, amount_cents, currency,
                    category_id FK?, cadence ('monthly'), day_of_month,
                    starts_on, ends_on?, note, active, created_at

settings            key PK, value
                    -- known keys: base_currency, cash_on_hand_cents,
                    --             fiscal_year_start_month
```

Foreign-key cascades:

| Parent | Child | On delete |
| --- | --- | --- |
| `projects` | `entries` | `cascade` |
| `projects` | `recurring_rules` | `cascade` |
| `categories` | `entries.category_id` | `set null` |
| `categories` | `recurring_rules.category_id` | `set null` |
| `recurring_rules` | `entries.source_rule_id` | `set null` |

So deleting a project removes its entries and rules. Deleting a category or
rule leaves its entries intact and uncategorized / orphaned.

---

## Design system

### Fonts

- **Display / sans: Bricolage Grotesque** (variable, latin subset). Confident,
  humanist, distinctive at large sizes, readable at body sizes.
- **Mono / numerics: JetBrains Mono**. Tabular by default, unambiguous zeros
  and ones — every number in the UI is in mono with `tabular-nums`.

Loaded via `next/font/google` in `app/layout.tsx`, exposed as
`--font-display` and `--font-mono` CSS variables.

### Palette

A warm-paper ledger feel, no stoplight UI:

| Token | Hex | Purpose |
| --- | --- | --- |
| `--color-paper` | `#f5efe2` | Page background — warm ivory |
| `--color-card` | `#fbf7ec` | Card surface, slightly lighter |
| `--color-ink` | `#1a1714` | Primary text |
| `--color-muted` | `#6b6357` | Secondary text, axis labels |
| `--color-hairline` | `#d8cfb8` | 1 px borders |
| `--color-olive` | `#6b6a2a` | Primary accent — buttons, links, focus |
| `--color-gain` | `#2f6a3a` | Deep moss green — net positive |
| `--color-loss` | `#a8472b` | Terracotta — net negative |

Plus tint/soft variants for backgrounds and an 8-color categorical palette for
charts. Defined in `app/globals.css` under `@theme inline { ... }`.

### Touches

- Hairline borders on every surface, 6px rounded corners (not pill, not sharp).
- Subtle paper-grain overlay on `body::before` (pure CSS radial gradients).
- Custom focus rings (`outline-2 outline-offset-2 outline-olive`).
- Recharts entirely restyled — dashed horizontal grid, mono ticks, Card-style
  tooltip, gain-soft and loss-soft gradient bars, ink-color net line.
- `prefers-reduced-motion` guard kills animations.

---

## Export & import

### Format

`GET /api/export` returns a single JSON file:

```json
{
  "version": 1,
  "exportedAt": "2026-05-13T08:58:53.509Z",
  "projects": [ { "id": 3, "slug": "...", ... }, ... ],
  "categories": [ { "id": 1, "name": "Hosting", "kind": "expense", ... }, ... ],
  "recurring_rules": [ ... ],
  "entries": [ ... ],
  "settings": [ { "key": "base_currency", "value": "EUR" }, ... ]
}
```

Every row, every column, IDs included. Filename is
`bottomline-YYYY-MM-DD.json`.

### Automated backup

```sh
curl -o "bottomline-$(date +%F).json" http://localhost:3000/api/export
```

Drop that in cron for daily backups.

### Import

**Settings → Export & import → Replace all data.** Hard-replace semantics:

1. zod validates the file's shape before touching anything.
2. Everything happens inside a single SQLite transaction. Partial failure
   rolls back.
3. All tables wiped in dependency order; rows reinserted with original IDs so
   foreign keys stay valid.
4. `sqlite_sequence` is bumped to `max(id)` per table so the next auto-insert
   doesn't collide.
5. A browser confirm dialog guards the destructive action.

50 MB file cap — way above any realistic dataset.

---

## Deployment

This is a single-binary-ish Node app. Options in order of simplicity:

- **Bare metal / Pi / homelab**: `pnpm build && pnpm start`. Run it behind
  Caddy / nginx / Cloudflare Tunnel. Mount a volume for `data/`.
- **Docker**: build a standard Node image, copy the project, expose port 3000,
  volume-mount `/app/data`. (No Dockerfile shipped — write one if you need it.)
- **Vercel and friends**: not recommended for the default SQLite setup —
  serverless filesystems are ephemeral. If you must, point `DATABASE_PATH` at
  Turso (libSQL) or swap `better-sqlite3` for `@libsql/client` + Drizzle's
  libSQL driver in `db/client.ts`.

**Back up your DB.** This app is self-hosted; nobody else is. Either `curl`
the export endpoint on a schedule (see above) or back up the `data/` directory
directly.

---

## FAQ

**Why is MRR €17 but May's income on the chart is €40?**
MRR is the *recurring* part — only active recurring income rules count. A
one-off €23 consulting payment shows on the chart but not in MRR.

**Why is my Net YTD negative but the mo/mo delta chip is green?**
The chip shows the change from the prior month. Going from `-€30` to `-€20`
is a `+€10` improvement, even though both numbers are losses.

**I edited a rule but old entries look the same.**
Refresh the page — server-component caches revalidate on the action's
`revalidatePath`. If the field doesn't propagate, it's a date field
(`day_of_month`, `starts_on`, `ends_on`) — those are intentionally left alone.

**I deleted a recurring rule. Where did its past entries go?**
They're still there in the entries table, just orphaned (their
`source_rule_id` is now `NULL`). The "↻ recurring" tag disappears because
there's no rule to point at.

**Can I export to CSV?**
Not yet. JSON only. Drop a feature request if you need it.

**Where do I change the FX rate table?**
`lib/fx.ts`. Edit the rates relative to USD and restart the server.

**Does dark mode work?**
No, light only in v1.

---

## License

MIT.
