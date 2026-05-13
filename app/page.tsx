import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { StatTile } from "@/components/dashboard/StatTile";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { RunwayBar } from "@/components/dashboard/RunwayBar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Sparkline } from "@/components/dashboard/Sparkline";

import { listProjects } from "@/lib/queries/projects";
import {
  listAllRecurringRules,
  listCategories,
  listEntries,
} from "@/lib/queries/entries";
import { materializeRecurring } from "@/lib/queries/materialize";
import { getSettings } from "@/lib/settings";
import {
  burnRate,
  categoryBreakdown,
  lifetimeTotals,
  monthlySeries,
  mrrFallback,
  mrrFromRules,
  netBurnRate,
  runwayMonths,
  ytdNet,
} from "@/lib/metrics";
import { trailingMonthRange } from "@/lib/date";

export default async function DashboardPage() {
  // Idempotently materialize anything past-due, then read fresh state.
  materializeRecurring();

  const settings = getSettings();
  const projects = listProjects();
  const allRules = listAllRecurringRules();
  const allEntries = listEntries({ limit: 5000 });
  const categories = listCategories();

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Start by adding your first project — anything you ship that has costs or earnings."
        action={
          <LinkButton href="/projects/new" variant="primary">
            Add a project
          </LinkButton>
        }
      />
    );
  }

  const baseCurrency = settings.baseCurrency;
  const range = trailingMonthRange(12);
  const series = monthlySeries(allEntries, range, baseCurrency);

  const mrrRules = mrrFromRules(allRules, baseCurrency);
  const mrrComputed = mrrRules > 0 ? mrrRules : mrrFallback(allEntries, baseCurrency);
  const burn = burnRate(allEntries, 3, baseCurrency);
  const netBurn = netBurnRate(allEntries, 3, baseCurrency);
  const runway = runwayMonths(settings.cashOnHandCents, netBurn);
  const isProfitable = netBurn <= 0;
  const ytd = ytdNet(allEntries, baseCurrency);
  const totals = lifetimeTotals(allEntries, baseCurrency);

  // Last month vs prior delta on net
  const last = series[series.length - 1];
  const prior = series[series.length - 2];
  const netDelta = last && prior ? last.netCents - prior.netCents : 0;

  // Sparkline values from net series
  const netSpark = series.map((s) => s.netCents);
  const mrrSpark = series.map((s) => s.incomeCents);

  // Category breakdowns over trailing 12 months — income and expense sides.
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const fallbackPalette = [
    "var(--color-cat-1)",
    "var(--color-cat-2)",
    "var(--color-cat-3)",
    "var(--color-cat-4)",
    "var(--color-cat-5)",
    "var(--color-cat-6)",
    "var(--color-cat-7)",
    "var(--color-cat-8)",
  ];
  const dressSlices = (
    raw: ReturnType<typeof categoryBreakdown>,
    incomeFallbacks = false
  ) =>
    raw.map((s, i) => {
      const cat = s.categoryId ? categoryById.get(s.categoryId) : null;
      return {
        id: s.categoryId,
        name:
          cat?.name ??
          (incomeFallbacks ? "Uncategorized income" : "Uncategorized"),
        color: cat?.color ?? fallbackPalette[i % fallbackPalette.length],
        totalCents: s.totalCents,
        fraction: s.fraction,
      };
    });
  const expenseSlices = dressSlices(
    categoryBreakdown(allEntries, baseCurrency, "expense")
  );
  const incomeSlices = dressSlices(
    categoryBreakdown(allEntries, baseCurrency, "income"),
    true
  );

  // Per-project mini stats
  const perProject = projects.map((p) => {
    const projEntries = allEntries.filter((e) => e.projectId === p.id);
    const projRules = allRules.filter((r) => r.projectId === p.id);
    const projMrr =
      mrrFromRules(projRules, baseCurrency) ||
      mrrFallback(projEntries, baseCurrency);
    const projBurn = burnRate(projEntries, 3, baseCurrency);
    const projYtd = ytdNet(projEntries, baseCurrency);
    return {
      project: p,
      mrrCents: projMrr,
      burnCents: projBurn,
      ytdNetCents: projYtd,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
          Bottomline · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <h1 className="text-3xl sm:text-4xl tracking-tight font-medium">
          The portfolio, at a glance.
        </h1>
        <p className="text-sm text-muted max-w-xl">
          Aggregate view across all {projects.length} project{projects.length === 1 ? "" : "s"}.
          Numbers shown in {baseCurrency}; entries in other currencies are converted at the
          configured rate.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Net · year to date"
          valueCents={ytd}
          accent={ytd >= 0 ? "gain" : "loss"}
          delta={netDelta}
          deltaSuffix="mo/mo"
          caption="Income minus expenses, current year"
          currency={baseCurrency}
        />
        <StatTile
          label="MRR · monthly recurring"
          valueCents={mrrComputed}
          accent="olive"
          caption={
            mrrRules > 0 ? "From active recurring income rules" : "Estimated from last month"
          }
          currency={baseCurrency}
          trailing={<Sparkline values={mrrSpark} tone="olive" />}
        />
        <StatTile
          label="Burn · 3-mo average"
          valueCents={burn}
          accent="loss"
          caption="Average monthly expense"
          currency={baseCurrency}
        />
        <StatTile
          label="Runway"
          value={isProfitable ? "∞" : `${runway.toFixed(1)} mo`}
          accent={
            isProfitable ? "gain" : runway < 6 ? "loss" : "gain"
          }
          format="number"
          caption={
            isProfitable
              ? `Net burn is negative — making ${(
                  -netBurn / 100
                ).toLocaleString("en-US", {
                  style: "currency",
                  currency: baseCurrency,
                })}/mo`
              : `Cash on hand: ${(settings.cashOnHandCents / 100).toLocaleString(
                  "en-US",
                  { style: "currency", currency: baseCurrency }
                )} · burns ${(netBurn / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: baseCurrency,
                })}/mo net`
          }
          trailing={<RunwayBar months={runway} className="w-32" />}
        />
      </section>

      <section className="flex flex-col gap-3">
        <Card
          tabbed
          eyebrow="Trailing 12 months"
          title="Income, expense & net"
        >
          <MonthlyChart data={series} currency={baseCurrency} />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card
            eyebrow="Trailing 12 months"
            title="Where the money comes from"
          >
            <CategoryBreakdown slices={incomeSlices} currency={baseCurrency} />
          </Card>
          <Card eyebrow="Trailing 12 months" title="Where the money goes">
            <CategoryBreakdown slices={expenseSlices} currency={baseCurrency} />
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl tracking-tight">Projects</h2>
          <LinkButton href="/projects/new" variant="ghost" size="sm">
            + New project
          </LinkButton>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {perProject.map((p) => (
            <ProjectCard
              key={p.project.id}
              project={p.project}
              mrrCents={p.mrrCents}
              burnCents={p.burnCents}
              ytdNetCents={p.ytdNetCents}
              currency={baseCurrency}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Lifetime income"
          valueCents={totals.incomeCents}
          accent="gain"
          format="money"
          currency={baseCurrency}
        />
        <StatTile
          label="Lifetime expense"
          valueCents={totals.expenseCents}
          accent="loss"
          format="money"
          currency={baseCurrency}
        />
        <StatTile
          label="Lifetime net"
          valueCents={totals.netCents}
          accent={totals.netCents >= 0 ? "gain" : "loss"}
          format="money"
          currency={baseCurrency}
          trailing={<Sparkline values={netSpark} tone={totals.netCents >= 0 ? "gain" : "loss"} />}
        />
      </section>
    </div>
  );
}
