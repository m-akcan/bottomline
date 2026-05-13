"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  createProject,
  updateProject,
} from "@/lib/actions/projects";
import type { ActionState } from "@/lib/actions/_shared";
import type { Project } from "@/db/schema";

const initial: ActionState = { ok: false };

export interface ProjectFormProps {
  project?: Project;
}

const SWATCHES = [
  "#6b6a2a",
  "#a8472b",
  "#7a5a8a",
  "#5a8a7a",
  "#b8854a",
  "#8a5a6a",
  "#4a7a8a",
  "#8a7a4a",
  "#2f6a3a",
  "#1a1714",
];

export function ProjectForm({ project }: ProjectFormProps) {
  const action = project ? updateProject.bind(null, project.id) : createProject;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-xl">
      {state.message && !state.ok && (
        <p className="text-sm text-loss bg-loss-tint border border-loss-soft rounded-[4px] px-3 py-2">
          {state.message}
        </p>
      )}
      {state.message && state.ok && (
        <p className="text-sm text-gain bg-gain-tint border border-gain-soft rounded-[4px] px-3 py-2">
          {state.message}
        </p>
      )}

      <Field
        label="Name"
        required
        error={state.fieldErrors?.name}
        htmlFor="project-name"
      >
        <Input
          id="project-name"
          name="name"
          required
          defaultValue={project?.name}
          placeholder="Helios Analytics"
        />
      </Field>

      <Field
        label="Description"
        hint="Optional"
        error={state.fieldErrors?.description}
        htmlFor="project-desc"
      >
        <Textarea
          id="project-desc"
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
          placeholder="Lightweight web analytics for indie devs."
        />
      </Field>

      <Field label="Color" error={state.fieldErrors?.color}>
        <ColorPicker name="color" defaultValue={project?.color ?? "#6b6a2a"} />
      </Field>

      <Field
        label="Launched on"
        hint="Optional"
        error={state.fieldErrors?.launchedOn}
        htmlFor="project-launched"
      >
        <Input
          id="project-launched"
          name="launchedOn"
          type="date"
          defaultValue={project?.launchedOn ?? ""}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}

function ColorPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((c, i) => (
        <label
          key={c}
          className="relative cursor-pointer"
          title={c}
        >
          <input
            type="radio"
            name={name}
            value={c}
            defaultChecked={defaultValue === c || (defaultValue === SWATCHES[0] && i === 0)}
            className="peer sr-only"
          />
          <span
            className="block w-7 h-7 rounded-[4px] border border-hairline peer-checked:ring-2 peer-checked:ring-olive peer-checked:ring-offset-2 peer-checked:ring-offset-paper transition-shadow"
            style={{ background: c }}
          />
        </label>
      ))}
    </div>
  );
}
