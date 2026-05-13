"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { entries, projects } from "@/db/schema";
import { entrySchema } from "@/lib/validators";
import { toCents } from "@/lib/money";
import {
  type ActionState,
  fromFormData,
  toFieldErrors,
} from "./_shared";

function getProjectSlug(projectId: number): string | undefined {
  return db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, projectId))
    .get()?.slug;
}

export async function createEntry(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(entrySchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  const amountCents = toCents(Number(data.amount));
  if (amountCents <= 0) {
    return { ok: false, fieldErrors: { amount: "Must be greater than zero." } };
  }

  const categoryId =
    typeof data.categoryId === "number" && data.categoryId > 0
      ? data.categoryId
      : null;

  db.insert(entries)
    .values({
      projectId: data.projectId,
      type: data.type,
      amountCents,
      currency: data.currency,
      categoryId,
      occurredOn: data.occurredOn,
      note: data.note || null,
      sourceRuleId: null,
    })
    .run();

  const slug = getProjectSlug(data.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/entries`);
    redirect(`/projects/${slug}/entries`);
  }
  return { ok: true, message: "Entry added." };
}

export async function updateEntry(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(entrySchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  const amountCents = toCents(Number(data.amount));
  const categoryId =
    typeof data.categoryId === "number" && data.categoryId > 0
      ? data.categoryId
      : null;

  db.update(entries)
    .set({
      projectId: data.projectId,
      type: data.type,
      amountCents,
      currency: data.currency,
      categoryId,
      occurredOn: data.occurredOn,
      note: data.note || null,
    })
    .where(eq(entries.id, id))
    .run();

  const slug = getProjectSlug(data.projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/entries`);
  }
  return { ok: true, message: "Saved." };
}

export async function deleteEntry(id: number, projectId: number): Promise<void> {
  db.delete(entries).where(eq(entries.id, id)).run();
  const slug = getProjectSlug(projectId);
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/entries`);
  }
}
