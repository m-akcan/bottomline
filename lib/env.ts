import { z } from "zod";

const envSchema = z.object({
  DATABASE_PATH: z.string().min(1).default("./data/bottomline.db"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse({
  DATABASE_PATH: process.env.DATABASE_PATH,
  NODE_ENV: process.env.NODE_ENV,
});
