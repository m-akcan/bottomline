import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getProjectBySlug } from "@/lib/queries/projects";
import {
  archiveProject,
  deleteProject,
  unarchiveProject,
} from "@/lib/actions/projects";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header className="flex flex-col gap-2">
        <Link
          href={`/projects/${slug}`}
          className="text-xs text-muted hover:text-ink w-fit"
        >
          ← Back to {project.name}
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">Edit project</h1>
      </header>

      <Card tabbed>
        <ProjectForm project={project} />
      </Card>

      <Card
        eyebrow="Danger zone"
        title={project.archivedAt ? "Archived" : "Archive"}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {project.archivedAt
              ? "Restore this project to show it on the dashboard again."
              : "Hide this project from the dashboard. All entries and recurring rules are preserved."}
          </p>
          <form
            action={
              project.archivedAt
                ? unarchiveProject.bind(null, project.id)
                : archiveProject.bind(null, project.id)
            }
          >
            <Button variant={project.archivedAt ? "quiet" : "danger"} size="sm">
              {project.archivedAt ? "Restore project" : "Archive project"}
            </Button>
          </form>
        </div>
      </Card>

      <Card
        eyebrow="Danger zone"
        title="Delete permanently"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            Permanently remove this project, all its entries, and all its recurring
            rules. This cannot be undone.
          </p>
          <form action={deleteProject.bind(null, project.id)}>
            <Button variant="danger" size="sm">
              Delete permanently
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
