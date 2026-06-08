## Status (updated 2026-06-08)

Bottomline is an open-source, self-hosted, single-user finance ledger for indie
SaaS and side projects, backed by a local SQLite file. The feature set described
in the README is fully implemented and the app builds and runs; it is at an
early v1 (version 0.1.0) with no automated test suite yet.

### Overview
Bottomline tracks income and expenses per project and surfaces the metrics that
matter to a solo founder — MRR, gross burn, net-burn runway, and net month over
month — without sending any data to a third party. It is a Next.js 16 App Router
application using React Server Components and Server Actions, with a hand-rolled
design system (Bricolage Grotesque + JetBrains Mono on warm paper) and a
synchronous `better-sqlite3` + Drizzle data layer. There is no authentication by
design: it is meant to run on localhost, in a container, or on a homelab box for
a single owner. Recent work has focused on packaging the app for self-hosted
deployment (Dockerfile, docker-compose, and a CI workflow that builds and pushes
an image).

### Features
- Multiple projects, each with its own color, optional description and launch
  date, entries, recurring rules, and a per-project dashboard.
- Aggregate portfolio dashboard: Net YTD, MRR, gross burn, net-burn runway, and
  lifetime totals, plus a trailing-12-month income/expense/net chart.
- Twin trailing-12-month income and expense category breakdowns.
- Recurring rules with forward-only auto-materialization (so manual deletions
  stick), field propagation to past entries on edit, and a Regenerate button for
  a full gap-fill.
- Project lifecycle: archive (hidden from dashboards, restorable) and permanent
  hard-delete that cascades to entries and rules.
- Multi-currency support across 13 ISO currencies, aggregated to a base currency
  via a static FX table in `lib/fx.ts`.
- Lossless single-file JSON export (`GET /api/export`, curl-friendly for cron
  backups) and a transactional hard-replace import with zod validation.
- In-app settings: base currency, cash on hand, fiscal year start month, and
  full category CRUD (income/expense kind, per-category color).
- Custom, dependency-light design system; no component library, light theme only.

### Tech stack
- Next.js 16.2.6 (App Router, Server Actions, Turbopack) on React 19.2.4.
- TypeScript 5 (strict), Tailwind CSS v4 (config-by-CSS via `@theme inline`).
- SQLite through `better-sqlite3` 12 with Drizzle ORM 0.45 and drizzle-kit
  migrations (WAL mode, foreign keys on, singleton connection).
- Zod 4 for validation, Recharts 3 for charts, date-fns 4 for dates.
- pnpm for package management; tsx to run TypeScript scripts (migrate, seed).
- Docker (multi-stage Debian-slim image that applies migrations then `next
  start`) and a GitHub Actions workflow publishing to GHCR on main/master/tags.

### Architecture
- Server Components are the default; `"use client"` is reserved for interactive
  pieces (nav, forms using `useActionState`, charts).
- One Server Action file per resource under `lib/actions/`, returning an
  `ActionState` shape and calling `revalidatePath` after mutations.
- Pure, side-effect-free libraries (`metrics`, `recurring`, `money`, `date`,
  `fx`, `slug`) compute over already-fetched data; server-only reads live in
  `lib/queries/`.
- The schema (projects, categories, recurring_rules, entries, settings) is at an
  initial baseline with a single generated migration (`0000_magenta_iceman`).
- All routes are rendered dynamically (`export const dynamic = "force-dynamic"`
  in the root layout) to avoid SQLite locking during the build's static
  prerender pass.

### Known issues
- No automated tests exist yet; the pure libraries are structured to be unit
  tested later but no test harness is wired up.
- FX rates are static and hardcoded; changing them requires editing `lib/fx.ts`
  and restarting the server.
- Export is JSON only — there is no CSV export.
- The README's Deployment section still says "No Dockerfile shipped," which is
  now out of date since a Dockerfile, docker-compose.yml, and CI workflow have
  been added.
- The default SQLite setup is not suited to serverless/ephemeral filesystems
  (e.g. stock Vercel) without swapping the driver to a hosted libSQL backend.

### Scope (intentional non-goals for v1)
- No authentication (single self-hosted user).
- No dark mode (light theme only).
- No third-party UI kit (shadcn/Mantine/Tremor) and no `react-hook-form`; forms
  use native `<form>` + Server Actions + shared zod schemas.
