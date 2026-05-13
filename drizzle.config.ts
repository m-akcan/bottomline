import type { Config } from "drizzle-kit";
import { env } from "./lib/env";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_PATH,
  },
  strict: true,
  verbose: true,
} satisfies Config;
