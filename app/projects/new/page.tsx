import { Card } from "@/components/ui/Card";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
          New project
        </span>
        <h1 className="text-3xl tracking-tight font-medium">
          Add something you ship.
        </h1>
        <p className="text-sm text-muted mt-1">
          A project groups all the costs and earnings of one venture. You can edit or
          archive it later.
        </p>
      </header>
      <Card tabbed>
        <ProjectForm />
      </Card>
    </div>
  );
}
