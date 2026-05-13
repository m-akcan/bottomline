import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { RecurringForm } from "@/components/entries/RecurringForm";
import { getProjectBySlug } from "@/lib/queries/projects";
import {
  getRecurringRuleById,
  listCategories,
} from "@/lib/queries/entries";
import { getSettings } from "@/lib/settings";

export default async function EditRecurringRulePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const ruleId = Number(id);
  if (!Number.isFinite(ruleId)) notFound();
  const rule = getRecurringRuleById(ruleId);
  if (!rule || rule.projectId !== project.id) notFound();

  const categories = listCategories();
  const settings = getSettings();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header className="flex flex-col gap-2">
        <Link
          href={`/projects/${slug}/recurring`}
          className="text-xs text-muted hover:text-ink w-fit"
        >
          ← Recurring rules
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">
          Edit recurring rule
        </h1>
        <p className="text-sm text-muted">
          Changes apply going forward. Already-materialized past entries are not
          rewritten retroactively — edit them individually if needed.
        </p>
      </header>
      <Card tabbed>
        <RecurringForm
          project={project}
          categories={categories}
          baseCurrency={settings.baseCurrency}
          rule={rule}
        />
      </Card>
    </div>
  );
}
