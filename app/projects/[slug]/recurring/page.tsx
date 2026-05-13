import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecurringForm } from "@/components/entries/RecurringForm";
import {
  deleteRecurringRule,
  regenerateRecurringEntries,
  toggleRecurringRule,
} from "@/lib/actions/recurring";
import { getProjectBySlug } from "@/lib/queries/projects";
import {
  listAllRecurringRules,
  listCategories,
} from "@/lib/queries/entries";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { format, parseISO } from "date-fns";

export default async function RecurringRulesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const categories = listCategories();
  const settings = getSettings();
  const rules = listAllRecurringRules(project.id);
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/projects/${slug}`}
          className="text-xs text-muted hover:text-ink w-fit"
        >
          ← {project.name}
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">Recurring rules</h1>
        <p className="text-sm text-muted max-w-xl">
          Rules generate one entry per month automatically. Past months are
          materialized; future months are projected on the chart.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          tabbed
          eyebrow="Active & inactive"
          title={`${rules.length} rule${rules.length === 1 ? "" : "s"}`}
          flush
        >
          {rules.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No recurring rules"
                description="Add a monthly hosting cost, a subscription, or a recurring income."
              />
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {rules.map((r) => {
                const cat = r.categoryId ? catById.get(r.categoryId) : null;
                const toggleAction = async () => {
                  "use server";
                  await toggleRecurringRule(r.id, !r.active);
                };
                const deleteAction = async () => {
                  "use server";
                  await deleteRecurringRule(r.id);
                };
                return (
                  <li key={r.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag tone={r.type === "income" ? "gain" : "loss"}>
                          {r.type}
                        </Tag>
                        {cat && <Tag color={cat.color}>{cat.name}</Tag>}
                        {!r.active && <Tag tone="muted">paused</Tag>}
                      </div>
                      <p className="text-sm text-muted mt-1.5 tabular">
                        Day {r.dayOfMonth} · since{" "}
                        {format(parseISO(r.startsOn), "MMM yyyy")}
                        {r.endsOn &&
                          ` · until ${format(parseISO(r.endsOn), "MMM yyyy")}`}
                      </p>
                      {r.note && (
                        <p className="text-xs text-faint mt-1 line-clamp-1">
                          {r.note}
                        </p>
                      )}
                    </div>
                    <div className="tabular text-right">
                      <div
                        className={
                          r.type === "income" ? "text-gain" : "text-loss"
                        }
                      >
                        {r.type === "income" ? "+" : "−"}{" "}
                        {formatMoney(r.amountCents, { currency: r.currency })}
                      </div>
                      <div className="text-[10px] text-faint">{r.currency}/mo</div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <LinkButton
                        href={`/projects/${slug}/recurring/${r.id}/edit`}
                        variant="quiet"
                        size="sm"
                      >
                        Edit
                      </LinkButton>
                      <form
                        action={regenerateRecurringEntries.bind(null, r.id)}
                      >
                        <Button
                          variant="quiet"
                          size="sm"
                          title="Restore any past entries from this rule that were deleted"
                        >
                          Regenerate
                        </Button>
                      </form>
                      <form action={toggleAction}>
                        <Button variant="quiet" size="sm">
                          {r.active ? "Pause" : "Resume"}
                        </Button>
                      </form>
                      <form action={deleteAction}>
                        <Button variant="danger" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card eyebrow="Add new" title="New recurring rule">
          <RecurringForm
            project={project}
            categories={categories}
            baseCurrency={settings.baseCurrency}
          />
        </Card>
      </div>
    </div>
  );
}
