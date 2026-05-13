import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./client";

const migrationsFolder = path.resolve(process.cwd(), "db/migrations");

console.log(`[migrate] running migrations from ${migrationsFolder}`);
migrate(db, { migrationsFolder });
console.log("[migrate] done");

sqlite.close();
