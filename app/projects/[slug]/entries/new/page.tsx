import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { EntryForm } from "@/components/entries/EntryForm";
import { getProjectBySlug } from "@/lib/queries/projects";
import { listCategories } from "@/lib/queries/entries";
import { getSettings } from "@/lib/settings";

export default async function NewEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const categories = listCategories();
  const settings = getSettings();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header className="flex flex-col gap-2">
        <Link
          href={`/projects/${slug}/entries`}
          className="text-xs text-muted hover:text-ink w-fit"
        >
          ← Entries
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">New entry</h1>
        <p className="text-sm text-muted">
          Logging to <span className="text-ink">{project.name}</span>.
        </p>
      </header>
      <Card tabbed>
        <EntryForm
          project={project}
          categories={categories}
          baseCurrency={settings.baseCurrency}
        />
      </Card>
    </div>
  );
}
