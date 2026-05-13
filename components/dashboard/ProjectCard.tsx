import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { Project } from "@/db/schema";

export interface ProjectCardProps {
  project: Project;
  mrrCents: number;
  burnCents: number;
  ytdNetCents: number;
  currency?: string;
}

export function ProjectCard({
  project,
  mrrCents,
  burnCents,
  ytdNetCents,
  currency = "USD",
}: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative block bg-card border border-hairline rounded-[6px] pl-5 pr-5 py-4 hover:bg-card-deep transition-colors"
    >
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r"
        style={{ background: project.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium tracking-tight text-ink truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-muted line-clamp-1 mt-0.5">
              {project.description}
            </p>
          )}
        </div>
        <span className="text-faint text-xs group-hover:text-olive transition-colors">
          →
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-hairline">
        <Stat label="MRR" value={formatMoney(mrrCents, { currency, compactCents: true })} />
        <Stat
          label="Burn"
          value={formatMoney(burnCents, { currency, compactCents: true })}
        />
        <Stat
          label="YTD"
          value={formatMoney(ytdNetCents, { currency, compactCents: true, signed: true })}
          tone={ytdNetCents >= 0 ? "gain" : "loss"}
        />
      </dl>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd
        className={`tabular text-[13px] mt-0.5 ${
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
