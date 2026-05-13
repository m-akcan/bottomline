import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "./fx";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected hex color like #aabbcc");

const moneyString = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,\s]/g, ""))
  .refine((v) => v !== "" && !Number.isNaN(Number(v)), "Must be a number");

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  color: hexColor.default("#6b6a2a"),
  launchedOn: isoDate.optional().or(z.literal("")),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  kind: z.enum(["expense", "income"]).default("expense"),
  color: hexColor.default("#a8472b"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const entrySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  type: z.enum(["income", "expense"]),
  amount: moneyString,
  currency: z.enum(SUPPORTED_CURRENCIES as [string, ...string[]]),
  categoryId: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.literal("0")])
    .optional(),
  occurredOn: isoDate,
  note: z.string().trim().max(280).optional().or(z.literal("")),
});

export type EntryInput = z.infer<typeof entrySchema>;

export const recurringSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  type: z.enum(["income", "expense"]),
  amount: moneyString,
  currency: z.enum(SUPPORTED_CURRENCIES as [string, ...string[]]),
  categoryId: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.literal("0")])
    .optional(),
  dayOfMonth: z.coerce.number().int().min(1).max(28).default(1),
  startsOn: isoDate,
  endsOn: isoDate.optional().or(z.literal("")),
  note: z.string().trim().max(280).optional().or(z.literal("")),
});

export type RecurringInput = z.infer<typeof recurringSchema>;

export const settingsSchema = z.object({
  baseCurrency: z.enum(SUPPORTED_CURRENCIES as [string, ...string[]]),
  cashOnHand: moneyString,
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12).default(1),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
