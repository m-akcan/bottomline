import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ArchivedProjectRow } from "@/components/projects/ArchivedProjectRow";
import {
  listArchivedProjects,
  listProjects,
} from "@/lib/queries/projects";
import { listAllRecurringRules, listEntries } from "@/lib/queries/entries";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/cn";
import {
  burnRate,
  mrrFallback,
  mrrFromRules,
  ytdNet,
} from "@/lib/metrics";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const search = await searchParams;
  const showArchived = search.show === "archived";

  const settings = getSettings();
  const projects = listProjects();
  const archived = listArchivedProjects();
  const allEntries = listEntries({ limit: 5000 });
  const allRules = listAllRecurringRules();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
            {showArchived ? "Archived projects" : "All projects"}
          </span>
          <h1 className="text-3xl tracking-tight font-medium">
            {showArchived
              ? `${archived.length} archived`
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 bg-card-deep border border-hairline rounded-[5px] gap-0.5">
            <Link
              href="/projects"
              className={cn(
                "h-7 px-3 inline-flex items-center text-xs rounded-[3px] transition-colors",
                !showArchived
                  ? "bg-paper text-ink"
                  : "text-muted hover:text-ink"
              )}
            >
              Active
            </Link>
            <Link
              href="/projects?show=archived"
              className={cn(
                "h-7 px-3 inline-flex items-center text-xs rounded-[3px] transition-colors",
                showArchived
                  ? "bg-paper text-ink"
                  : "text-muted hover:text-ink"
              )}
            >
              Archived
              {archived.length > 0 && (
                <span className="ml-1.5 tabular text-faint">
                  {archived.length}
                </span>
              )}
            </Link>
          </div>
          <LinkButton href="/projects/new" variant="primary">
            + New project
          </LinkButton>
        </div>
      </header>

      {showArchived ? (
        archived.length === 0 ? (
          <EmptyState
            title="Nothing archived"
            description="When you archive a project, it'll show up here so you can restore or permanently delete it."
          />
        ) : (
          <Card flush>
            <ul className="divide-y divide-hairline">
              {archived.map((p) => (
                <ArchivedProjectRow key={p.id} project={p} />
              ))}
            </ul>
          </Card>
        )
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Track a SaaS, a side project, anything with costs and earnings."
          action={
            <LinkButton href="/projects/new" variant="primary">
              Add a project
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => {
            const e = allEntries.filter((x) => x.projectId === p.id);
            const r = allRules.filter((x) => x.projectId === p.id);
            const mrr =
              mrrFromRules(r, settings.baseCurrency) ||
              mrrFallback(e, settings.baseCurrency);
            return (
              <ProjectCard
                key={p.id}
                project={p}
                mrrCents={mrr}
                burnCents={burnRate(e, 3, settings.baseCurrency)}
                ytdNetCents={ytdNet(e, settings.baseCurrency)}
                currency={settings.baseCurrency}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
