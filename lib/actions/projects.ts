"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { projectSchema } from "@/lib/validators";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import { listProjectSlugs } from "@/lib/queries/projects";
import {
  type ActionState,
  fromFormData,
  toFieldErrors,
} from "./_shared";

export async function createProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(projectSchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  const baseSlug = slugify(data.name) || "project";
  const slug = ensureUniqueSlug(baseSlug, listProjectSlugs());

  db.insert(projects)
    .values({
      slug,
      name: data.name,
      description: data.description || null,
      color: data.color,
      launchedOn: data.launchedOn || null,
    })
    .run();

  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}

export async function updateProject(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(projectSchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;

  db.update(projects)
    .set({
      name: data.name,
      description: data.description || null,
      color: data.color,
      launchedOn: data.launchedOn || null,
    })
    .where(eq(projects.id, id))
    .run();

  revalidatePath("/");
  revalidatePath("/projects");
  return { ok: true, message: "Saved." };
}

export async function archiveProject(id: number): Promise<void> {
  db.update(projects)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(projects.id, id))
    .run();
  revalidatePath("/");
  revalidatePath("/projects");
  redirect("/projects");
}

export async function unarchiveProject(id: number): Promise<void> {
  db.update(projects)
    .set({ archivedAt: null })
    .where(eq(projects.id, id))
    .run();
  revalidatePath("/");
  revalidatePath("/projects");
}

export async function deleteProject(id: number): Promise<void> {
  db.delete(projects).where(eq(projects.id, id)).run();
  revalidatePath("/");
  revalidatePath("/projects");
  redirect("/projects");
}
