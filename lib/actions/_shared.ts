import type { z } from "zod";

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const initialActionState: ActionState = { ok: false };

export function fromFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
): ReturnType<T["safeParse"]> {
  const obj: Record<string, FormDataEntryValue | null> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return schema.safeParse(obj) as ReturnType<T["safeParse"]>;
}

export function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path.join(".") || "_";
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
