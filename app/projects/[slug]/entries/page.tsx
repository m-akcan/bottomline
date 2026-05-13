import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryTable } from "@/components/entries/EntryTable";
import { EntryFilters } from "@/components/entries/EntryFilters";
import { getProjectBySlug } from "@/lib/queries/projects";
import { listEntries } from "@/lib/queries/entries";

export default async function ProjectEntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const typeFilter =
    search.type === "income" || search.type === "expense"
      ? search.type
      : undefined;

  const entries = listEntries({
    projectId: project.id,
    type: typeFilter,
    limit: 1000,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          href={`/projects/${slug}`}
          className="text-xs text-muted hover:text-ink w-fit"
        >
          ← {project.name}
        </Link>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Entries
            </span>
            <h1 className="text-3xl tracking-tight font-medium">
              {entries.length} entr{entries.length === 1 ? "y" : "ies"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <EntryFilters basePath={`/projects/${slug}/entries`} />
            <LinkButton
              href={`/projects/${slug}/entries/new`}
              variant="primary"
              size="md"
            >
              + Entry
            </LinkButton>
          </div>
        </div>
      </header>

      <Card flush>
        {entries.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No entries yet"
              description="Log a cost or earning and it'll show up here."
              action={
                <LinkButton href={`/projects/${slug}/entries/new`} variant="primary">
                  Add your first entry
                </LinkButton>
              }
            />
          </div>
        ) : (
          <EntryTable entries={entries} />
        )}
      </Card>
    </div>
  );
}
