import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ImportForm } from "@/components/projects/ImportForm";
import { db } from "@/db/client";
import {
  categories,
  entries,
  projects,
  recurringRules,
} from "@/db/schema";

export default function DataSettingsPage() {
  const safe = {
    projects: db.select().from(projects).all().length,
    categories: db.select().from(categories).all().length,
    entries: db.select().from(entries).all().length,
    rules: db.select().from(recurringRules).all().length,
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header className="flex flex-col gap-2">
        <Link href="/settings" className="text-xs text-muted hover:text-ink w-fit">
          ← Settings
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">Export &amp; import</h1>
        <p className="text-sm text-muted max-w-xl">
          A full JSON backup of every project, entry, recurring rule, category, and
          setting. Round-trips cleanly — exporting and re-importing reproduces the
          database exactly.
        </p>
      </header>

      <Card tabbed eyebrow="Backup" title="Export">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm text-muted">
              Download a single JSON file with everything currently in the database.
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-4">
              <Stat label="Projects" value={safe.projects} />
              <Stat label="Entries" value={safe.entries} />
              <Stat label="Recurring rules" value={safe.rules} />
              <Stat label="Categories" value={safe.categories} />
            </dl>
          </div>
          <LinkButton href="/api/export" variant="primary">
            Download backup
          </LinkButton>
        </div>
      </Card>

      <Card eyebrow="Restore" title="Import">
        <p className="text-sm text-muted mb-4">
          Upload a previously exported JSON file. This{" "}
          <strong className="text-loss">replaces all current data</strong> with the
          file&rsquo;s contents — original IDs are preserved so foreign keys stay
          valid. Run a fresh <span className="tabular">Download backup</span>{" "}
          first if you&rsquo;re not sure.
        </p>
        <ImportForm />
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="tabular text-base text-ink mt-0.5">{value}</dd>
    </div>
  );
}
