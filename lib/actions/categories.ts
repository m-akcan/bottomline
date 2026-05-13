"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { categorySchema } from "@/lib/validators";
import {
  type ActionState,
  fromFormData,
  toFieldErrors,
} from "./_shared";

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(categorySchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  try {
    db.insert(categories)
      .values({ name: data.name, kind: data.kind, color: data.color })
      .run();
  } catch {
    return {
      ok: false,
      fieldErrors: { name: "A category with that name already exists." },
    };
  }
  revalidatePath("/settings/categories");
  revalidatePath("/");
  return { ok: true, message: "Category added." };
}

export async function updateCategory(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(categorySchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  db.update(categories)
    .set({ name: data.name, kind: data.kind, color: data.color })
    .where(eq(categories.id, id))
    .run();
  revalidatePath("/settings/categories");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function deleteCategory(id: number): Promise<void> {
  db.delete(categories).where(eq(categories.id, id)).run();
  revalidatePath("/settings/categories");
  revalidatePath("/");
}
