"use server";

import { revalidatePath } from "next/cache";

import { settingsSchema } from "@/lib/validators";
import { toCents } from "@/lib/money";
import { setSetting } from "@/lib/settings";
import {
  type ActionState,
  fromFormData,
  toFieldErrors,
} from "./_shared";

export async function updateSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = fromFormData(settingsSchema, formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      message: "Fix the highlighted fields.",
    };
  }
  const data = parsed.data;
  setSetting("base_currency", data.baseCurrency);
  setSetting("cash_on_hand_cents", String(toCents(Number(data.cashOnHand))));
  setSetting("fiscal_year_start_month", String(data.fiscalYearStartMonth));

  revalidatePath("/");
  revalidatePath("/settings/general");
  return { ok: true, message: "Settings saved." };
}
