import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatTile } from "@/components/dashboard/StatTile";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { Sparkline } from "@/components/dashboard/Sparkline";

import { getProjectBySlug } from "@/lib/queries/projects";
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
  ytdNet,
} from "@/lib/metrics";
import { trailingMonthRange } from "@/lib/date";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  materializeRecurring();

  const settings = getSettings();
  const entries = listEntries({ projectId: project.id, limit: 5000 });
  const rules = listAllRecurringRules(project.id);
  const categories = listCategories();
  const range = trailingMonthRange(12);
  const series = monthlySeries(entries, range, settings.baseCurrency);

  const mrr =
    mrrFromRules(rules, settings.baseCurrency) ||
    mrrFallback(entries, settings.baseCurrency);
  const burn = burnRate(entries, 3, settings.baseCurrency);
  const ytd = ytdNet(entries, settings.baseCurrency);
  const totals = lifetimeTotals(entries, settings.baseCurrency);

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
    categoryBreakdown(entries, settings.baseCurrency, "expense")
  );
  const incomeSlices = dressSlices(
    categoryBreakdown(entries, settings.baseCurrency, "income"),
    true
  );

  const netSpark = series.map((s) => s.netCents);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="text-xs text-muted hover:text-ink inline-flex items-center gap-1.5 w-fit"
        >
          <span>←</span> All projects
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block w-3 h-3 rounded-[3px]"
                style={{ background: project.color }}
              />
              <h1 className="text-3xl tracking-tight font-medium">
                {project.name}
              </h1>
            </div>
            {project.description && (
              <p className="text-sm text-muted max-w-xl">{project.description}</p>
            )}
            {project.launchedOn && (
              <p className="text-xs text-faint tabular">
                Launched {new Date(project.launchedOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <LinkButton
              href={`/projects/${slug}/entries/new`}
              variant="primary"
              size="md"
            >
              + Entry
            </LinkButton>
            <LinkButton
              href={`/projects/${slug}/entries`}
              variant="quiet"
              size="md"
            >
              Entries
            </LinkButton>
            <LinkButton
              href={`/projects/${slug}/recurring`}
              variant="quiet"
              size="md"
            >
              Recurring
            </LinkButton>
            <LinkButton href={`/projects/${slug}/edit`} variant="ghost" size="sm">
              Edit
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="MRR"
          valueCents={mrr}
          accent="olive"
          caption={
            rules.length > 0 ? "From active recurring rules" : "Last month's income"
          }
          currency={settings.baseCurrency}
        />
        <StatTile
          label="Burn (3-mo avg)"
          valueCents={burn}
          accent="loss"
          currency={settings.baseCurrency}
        />
        <StatTile
          label="Year to date"
          valueCents={ytd}
          accent={ytd >= 0 ? "gain" : "loss"}
          currency={settings.baseCurrency}
        />
        <StatTile
          label="Lifetime net"
          valueCents={totals.netCents}
          accent={totals.netCents >= 0 ? "gain" : "loss"}
          currency={settings.baseCurrency}
          trailing={
            <Sparkline
              values={netSpark}
              tone={totals.netCents >= 0 ? "gain" : "loss"}
            />
          }
        />
      </section>

      <section className="flex flex-col gap-3">
        <Card
          tabbed
          eyebrow="Trailing 12 months"
          title="Income, expense & net"
        >
          <MonthlyChart data={series} currency={settings.baseCurrency} />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card
            eyebrow="Trailing 12 months"
            title="Where the money comes from"
          >
            <CategoryBreakdown
              slices={incomeSlices}
              currency={settings.baseCurrency}
            />
          </Card>
          <Card eyebrow="Trailing 12 months" title="Where the money goes">
            <CategoryBreakdown
              slices={expenseSlices}
              currency={settings.baseCurrency}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
