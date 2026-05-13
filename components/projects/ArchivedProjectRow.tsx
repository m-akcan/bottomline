import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import {
  deleteProject,
  unarchiveProject,
} from "@/lib/actions/projects";
import type { Project } from "@/db/schema";
import { format, parseISO } from "date-fns";

export function ArchivedProjectRow({ project }: { project: Project }) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span
        aria-hidden
        className="w-3 h-3 rounded-[3px]"
        style={{ background: project.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/projects/${project.slug}`}
            className="text-sm font-medium text-ink hover:text-olive transition-colors"
          >
            {project.name}
          </Link>
          <Tag tone="muted">archived</Tag>
        </div>
        {project.description && (
          <p className="text-xs text-muted line-clamp-1 mt-0.5">
            {project.description}
          </p>
        )}
        {project.archivedAt && (
          <p className="text-[11px] text-faint tabular mt-1">
            Archived {format(parseISO(project.archivedAt), "MMM d, yyyy")}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <form action={unarchiveProject.bind(null, project.id)}>
          <Button variant="quiet" size="sm">
            Restore
          </Button>
        </form>
        <form action={deleteProject.bind(null, project.id)}>
          <Button variant="danger" size="sm">
            Delete permanently
          </Button>
        </form>
      </div>
    </li>
  );
}
