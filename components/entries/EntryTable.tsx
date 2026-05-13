import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import type { EntryWithRels } from "@/lib/queries/entries";
import { deleteEntry } from "@/lib/actions/entries";
import { format, parseISO } from "date-fns";

export interface EntryTableProps {
  entries: EntryWithRels[];
  showProject?: boolean;
}

export function EntryTable({ entries, showProject }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted tabular py-8 text-center">
        No entries match the filters.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline">
      {entries.map((e) => {
        const tone = e.type === "income" ? "gain" : "loss";
        const sign = e.type === "income" ? "+" : "−";
        const railColor = tone === "gain" ? "var(--color-gain)" : "var(--color-loss)";
        const onDelete = async () => {
          "use server";
          await deleteEntry(e.id, e.projectId);
        };
        return (
          <li
            key={e.id}
            className="group flex items-center gap-4 px-2 py-3 hover:bg-card-deep transition-colors"
          >
            <span
              aria-hidden
              className="w-[2px] self-stretch rounded-full"
              style={{ background: railColor }}
            />
            <div className="w-24 shrink-0">
              <span className="tabular text-xs text-muted">
                {format(parseISO(e.occurredOn), "MMM dd, yy")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {showProject && (
                  <Tag color={e.project.color} tone="muted">
                    {e.project.name}
                  </Tag>
                )}
                {e.category && (
                  <Tag color={e.category.color}>{e.category.name}</Tag>
                )}
                {e.sourceRuleId && <Tag tone="muted">↻ recurring</Tag>}
              </div>
              {e.note && (
                <p className="text-xs text-muted line-clamp-1 mt-1">{e.note}</p>
              )}
            </div>
            <div className="text-right">
              <div
                className={`tabular text-sm ${
                  tone === "gain" ? "text-gain" : "text-loss"
                }`}
              >
                {sign} {formatMoney(e.amountCents, { currency: e.currency })}
              </div>
              {e.currency !== "USD" && (
                <div className="text-[10px] text-faint tabular">{e.currency}</div>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <form action={onDelete}>
                <Button type="submit" variant="danger" size="sm">
                  Delete
                </Button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
